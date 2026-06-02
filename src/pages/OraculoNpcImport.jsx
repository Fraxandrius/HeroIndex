import { useMemo, useState } from 'react'
import { useCorporations } from '../hooks/useCorporations.js'
import { createOrUpdateCharacterSheet } from '../services/characterSheetsService.js'
import { createHero } from '../services/heroesService.js'

const attributeKeys = ['fighting', 'agility', 'strength', 'reason', 'intuition', 'presence']

function normalizeHeader(value = '') {
  return value.trim().replace(/^\uFEFF/, '').toLowerCase()
}

function splitCsvLine(line = '') {
  const values = []
  let currentValue = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      currentValue += '"'
      index += 1
    } else if (character === '"') {
      insideQuotes = !insideQuotes
    } else if (character === ',' && !insideQuotes) {
      values.push(currentValue.trim())
      currentValue = ''
    } else {
      currentValue += character
    }
  }

  values.push(currentValue.trim())

  return values
}

function parseCsv(csvText = '') {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)

  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line)
    const row = { rowNumber: index + 2 }

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? ''
    })

    return row
  })
}

function getField(row, ...names) {
  const foundName = names.map(normalizeHeader).find((name) => row[name] !== undefined && row[name] !== '')

  return foundName ? row[foundName] : ''
}

function parseNumber(value, fallback = 0) {
  const numberValue = Number(value)

  return Number.isNaN(numberValue) || value === '' ? fallback : numberValue
}

function parseCommaList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolveCorporation(rawCorporation, corporations) {
  const normalizedCorporation = rawCorporation.trim().toLowerCase()

  if (!normalizedCorporation) {
    return { corporationId: '', corporationName: '' }
  }

  const matchedCorporation = corporations.find(
    (corporation) =>
      corporation.id?.toLowerCase() === normalizedCorporation ||
      corporation.name?.toLowerCase() === normalizedCorporation,
  )

  if (matchedCorporation) {
    return { corporationId: matchedCorporation.id, corporationName: matchedCorporation.name }
  }

  return { corporationId: '', corporationName: rawCorporation.trim() }
}

function normalizeNpcRow(row, corporations) {
  const alias = getField(row, 'alias')
  const role = getField(row, 'role', 'type', 'occupation')
  const heroTitle = getField(row, 'heroTitle', 'type') || role
  const rawCorporation = getField(row, 'corporation', 'corp')
  const corporation = resolveCorporation(rawCorporation, corporations)
  const rankingPoints = parseNumber(getField(row, 'rankingPoints', 'score'), 0)
  const approval = parseNumber(getField(row, 'approval'), 0)
  const powers = parseCommaList(getField(row, 'powers'))
  const publicPowers = parseCommaList(getField(row, 'publicPowers'))
  const visiblePowers = publicPowers.length > 0 ? publicPowers : powers
  const validationErrors = alias.trim() ? [] : ['Falta alias']

  return {
    id: `${row.rowNumber}-${alias || 'sin-alias'}`,
    rowNumber: row.rowNumber,
    status: validationErrors.length > 0 ? 'invalid' : 'valid',
    validationErrors,
    preview: {
      alias,
      attributes: attributeKeys.map((key) => `${key}: ${parseNumber(getField(row, key), 1)}`).join(' / '),
      corporation: rawCorporation,
      heroTitle,
      rankingPoints,
      realName: getField(row, 'realName'),
    },
    heroPayload: {
      active: true,
      alias: alias.trim(),
      approval,
      avatarUrl: getField(row, 'avatarUrl').trim(),
      bannerUrl: getField(row, 'bannerUrl').trim(),
      codename: getField(row, 'codename', 'publicName').trim(),
      corporationId: corporation.corporationId,
      corporationName: corporation.corporationName,
      heroTitle: heroTitle.trim(),
      publicBio: getField(row, 'publicBio').trim(),
      publicName: getField(row, 'publicName').trim(),
      publicPowers: visiblePowers,
      rankingPoints,
    },
    sheetPayload: {
      attributes: Object.fromEntries(attributeKeys.map((key) => [key, parseNumber(getField(row, key), 1)])),
      drawbacks: parseCommaList(getField(row, 'drawbacks')),
      flags: parseCommaList(getField(row, 'flags')),
      gear: getField(row, 'gear').trim(),
      gmNotes: getField(row, 'gmNotes').trim(),
      health: parseNumber(getField(row, 'health'), 0),
      isNpc: true,
      karma: parseNumber(getField(row, 'karma'), 0),
      personality: getField(row, 'personality').trim(),
      powers,
      realName: getField(row, 'realName').trim(),
      relationships: getField(row, 'relationships').trim(),
      reputation: getField(row, 'reputation').trim(),
      resolve: parseNumber(getField(row, 'resolve'), 0),
      resources: getField(row, 'resources').trim(),
      risk: getField(row, 'risk').trim(),
      role: role.trim(),
      talents: parseCommaList(getField(row, 'talents')),
    },
  }
}

function OraculoNpcImport({ onNavigate }) {
  const { corporations } = useCorporations()
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResult, setImportResult] = useState(null)

  const validRows = useMemo(() => rows.filter((row) => row.status === 'valid'), [rows])
  const invalidRows = useMemo(() => rows.filter((row) => row.status === 'invalid'), [rows])

  const handleCsvFileChange = async (event) => {
    const file = event.target.files?.[0]
    setRows([])
    setFileName('')
    setFileError('')
    setImportResult(null)
    setImportProgress({ current: 0, total: 0 })

    if (!file) return

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')

    if (!isCsv) {
      setFileError('Selecciona un archivo CSV válido.')
      return
    }

    const text = await file.text()

    if (!text.trim()) {
      setFileError('El archivo CSV está vacío.')
      return
    }

    const parsedRows = parseCsv(text)

    if (parsedRows.length === 0) {
      setFileError('El CSV debe incluir encabezados y al menos una fila de datos.')
      return
    }

    setFileName(file.name)
    setRows(parsedRows.map((row) => normalizeNpcRow(row, corporations)))
  }

  const handleImportRows = async () => {
    const errors = []
    const createdHeroes = []

    setIsImporting(true)
    setImportResult(null)
    setImportProgress({ current: 0, total: validRows.length })

    for (const [index, row] of validRows.entries()) {
      setImportProgress({ current: index + 1, total: validRows.length })
      let heroId = ''

      try {
        const createdHero = await createHero(row.heroPayload)
        heroId = createdHero.id
        await createOrUpdateCharacterSheet(heroId, {
          ...row.sheetPayload,
          heroId,
          isNpc: true,
        })
        createdHeroes.push({ alias: row.preview.alias, heroId, rowNumber: row.rowNumber })
      } catch (error) {
        errors.push({
          message: error.message ?? String(error),
          partialHeroId: heroId,
          rowNumber: row.rowNumber,
        })
      }
    }

    setImportResult({
      createdHeroes,
      errors,
      omittedRows: invalidRows.length,
    })
    setIsImporting(false)
  }

  return (
    <section className="page-card oraculo-npc-import-page">
      <header className="oraculo-npc-import-hero">
        <p className="page-card__kicker">ORÁCULO / Importación masiva</p>
        <h2>Importador de NPCs ORÁCULO</h2>
        <p className="oraculo-npc-import-hero__subtitle">
          Carga múltiples héroes NPC desde CSV, separando perfil público y hoja privada.
        </p>
        <p>El archivo se procesa localmente en el navegador. No se sube el CSV a Firebase Storage.</p>
      </header>

      <section className="oraculo-npc-import-panel">
        <div>
          <h3>Upload CSV</h3>
          <p>Usa encabezados como alias, realName, corp, heroTitle, rankingPoints, powers, talents y atributos RPG.</p>
        </div>
        <label className="oraculo-npc-import-file">
          <span>Archivo CSV</span>
          <input accept=".csv,text/csv" onChange={handleCsvFileChange} type="file" />
        </label>
        {fileName ? <p className="oraculo-npc-import-state">Archivo detectado: {fileName}</p> : null}
        {fileError ? <p className="oraculo-npc-import-state oraculo-npc-import-state--error">{fileError}</p> : null}
      </section>

      {rows.length > 0 ? (
        <section className="oraculo-npc-import-panel">
          <div className="oraculo-npc-import-panel__header">
            <div>
              <h3>Preview de importación</h3>
              <p>{validRows.length} filas válidas · {invalidRows.length} filas omitidas por validación.</p>
            </div>
            <button disabled={isImporting || validRows.length === 0} onClick={handleImportRows} type="button">
              {isImporting ? `Importando ${importProgress.current} de ${importProgress.total}` : 'Importar NPCs válidos'}
            </button>
          </div>

          <div className="oraculo-npc-import-table-wrap">
            <table className="oraculo-npc-import-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Alias</th>
                  <th>Título / rol</th>
                  <th>Corp</th>
                  <th>Puntos</th>
                  <th>Nombre real</th>
                  <th>Atributos</th>
                  <th>Validación</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className={row.status === 'invalid' ? 'is-invalid' : ''} key={row.id}>
                    <td>{row.rowNumber}</td>
                    <td>{row.preview.alias || '—'}</td>
                    <td>{row.preview.heroTitle || row.sheetPayload.role || '—'}</td>
                    <td>{row.preview.corporation || '—'}</td>
                    <td>{row.preview.rankingPoints}</td>
                    <td>{row.preview.realName || '—'}</td>
                    <td>{row.preview.attributes}</td>
                    <td>{row.status === 'valid' ? 'Lista para importar' : row.validationErrors.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {importResult ? (
        <section className="oraculo-npc-import-panel oraculo-npc-import-result">
          <div>
            <h3>Resultado de importación</h3>
            <p>
              NPCs importados: {importResult.createdHeroes.length} · Filas omitidas: {importResult.omittedRows} · Errores: {importResult.errors.length}
            </p>
          </div>
          {importResult.createdHeroes.length > 0 ? (
            <div className="oraculo-npc-import-created-list">
              {importResult.createdHeroes.map((hero) => (
                <article key={hero.heroId}>
                  <div>
                    <strong>{hero.alias}</strong>
                    <span>Fila {hero.rowNumber}</span>
                  </div>
                  <button onClick={() => onNavigate?.('oraculo-hero-dossier', { heroId: hero.heroId })} type="button">
                    Ver dossier ORÁCULO
                  </button>
                </article>
              ))}
            </div>
          ) : null}
          {importResult.errors.length > 0 ? (
            <div className="oraculo-npc-import-errors">
              {importResult.errors.map((error) => (
                <p key={`${error.rowNumber}-${error.message}`}>
                  Fila {error.rowNumber}: {error.message}
                  {error.partialHeroId ? ` · Héroe público creado: ${error.partialHeroId}` : ''}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  )
}

export default OraculoNpcImport
