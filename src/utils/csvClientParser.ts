import { Client, ClientSource } from '../types';

/**
 * Fixes common Latin-1 / UTF-8 double-encoding mojibake patterns
 * e.g. "AraguaÃna" -> "Araguaína", "AGRONEGÃ“CIO" -> "AGRONEGÓCIO", "CARTÃƒO" -> "CARTÃO"
 */
export function fixMojibake(text: string): string {
  if (!text) return '';
  let str = text;

  // Common replacements for double-encoded UTF-8 in Portuguese
  const replacements: [RegExp, string][] = [
    [/Ã¡/g, 'á'],
    [/Ã /g, 'à'],
    [/Ã¢/g, 'â'],
    [/Ã£/g, 'ã'],
    [/Ã¤/g, 'ä'],
    [/Ã©/g, 'é'],
    [/Ãª/g, 'ê'],
    [/Ã­/g, 'í'],
    [/Ã®/g, 'î'],
    [/Ã³/g, 'ó'],
    [/Ã´/g, 'ô'],
    [/Ãµ/g, 'õ'],
    [/Ã¶/g, 'ö'],
    [/Ãº/g, 'ú'],
    [/Ã¼/g, 'ü'],
    [/Ã§/g, 'ç'],
    [/Ã/g, 'Á'],
    [/Ã€/g, 'À'],
    [/Ã‚/g, 'Â'],
    [/Ãƒ/g, 'Ã'],
    [/Ã‰/g, 'É'],
    [/ÃŠ/g, 'Ê'],
    [/Ã/g, 'Í'],
    [/Ã“/g, 'Ó'],
    [/Ã”/g, 'Ô'],
    [/Ã•/g, 'Õ'],
    [/Ãš/g, 'Ú'],
    [/Ã‡/g, 'Ç'],
    [/Âº/g, 'º'],
    [/Âª/g, 'ª'],
    [/NÂº/g, 'Nº'],
    [/NÂ°/g, 'Nº'],
    [/Ã/g, 'í'], // Specific case like "AraguaÃna" -> "Araguaína"
  ];

  for (const [pattern, replacement] of replacements) {
    str = str.replace(pattern, replacement);
  }

  return str.trim();
}

/**
 * Formats a Brazilian phone number from DDD and number parts
 */
export function formatPhoneNumber(ddd?: string, num?: string): string {
  if (!num || num.trim() === '' || num.trim() === '-') return '-';

  const cleanDdd = (ddd || '').replace(/\D/g, '').trim();
  const cleanNum = num.replace(/\D/g, '').trim();

  if (!cleanNum) return '-';

  // If number already includes DDD (e.g. 10 or 11 digits starting with cleanDdd or length >= 10)
  let full = cleanNum;
  if (cleanDdd && !cleanNum.startsWith(cleanDdd) && cleanNum.length <= 9) {
    full = cleanDdd + cleanNum;
  }

  if (full.length === 11) {
    return `(${full.slice(0, 2)}) ${full.slice(2, 7)}-${full.slice(7)}`;
  } else if (full.length === 10) {
    return `(${full.slice(0, 2)}) ${full.slice(2, 6)}-${full.slice(6)}`;
  } else if (cleanDdd) {
    return `(${cleanDdd}) ${num.trim()}`;
  }

  return num.trim();
}

/**
 * Normalizes a header string for matching (lowercased, accents removed, non-alphanumeric removed)
 */
function normalizeHeaderKey(rawHeader: string): string {
  const fixed = fixMojibake(rawHeader);
  return fixed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses a single CSV line respecting quotes and escaped quotes
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export interface ParseCsvResult {
  success: boolean;
  clients: Client[];
  detectedRegionais: string[];
  detectedTerritories: { name: string; code?: string; regional?: string }[];
  totalRows: number;
  error?: string;
}

/**
 * Parses client CSV for either "Mapa" (Arquivo 1) or "Geradores" (Arquivo 2)
 */
export function parseClientCsv(
  csvContent: string,
  source: ClientSource = 'mapa'
): ParseCsvResult {
  if (!csvContent || !csvContent.trim()) {
    return {
      success: false,
      clients: [],
      detectedRegionais: [],
      detectedTerritories: [],
      totalRows: 0,
      error: 'O arquivo CSV está vazio.',
    };
  }

  // Detect delimiter (, or ;)
  const firstLines = csvContent.split(/\r?\n/).slice(0, 3);
  const commaCount = (firstLines[0].match(/,/g) || []).length;
  const semicolonCount = (firstLines[0].match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      clients: [],
      detectedRegionais: [],
      detectedTerritories: [],
      totalRows: 0,
      error: 'O arquivo CSV deve conter um cabeçalho e pelo menos uma linha de dados.',
    };
  }

  const rawHeaders = parseCsvLine(lines[0], delimiter);
  const headerMap: { [key: string]: number } = {};

  rawHeaders.forEach((raw, idx) => {
    const norm = normalizeHeaderKey(raw);
    headerMap[norm] = idx;
  });

  // Helper to find column index matching variations
  const findCol = (...variations: string[]): number => {
    for (const v of variations) {
      const norm = normalizeHeaderKey(v);
      if (headerMap[norm] !== undefined) {
        return headerMap[norm];
      }
    }
    return -1;
  };

  const colRegional = findCol('Regional');
  const colCodTerritorio = findCol('Cod. Território', 'Cod Territorio', 'Codigo do Territorio');
  const colTerritorio = findCol('Território', 'Territorio');
  const colNomeCliente = findCol('Nome do Cliente', 'Cliente');
  const colCodCliente = findCol('Código do Cliente', 'Codigo do Cliente', 'Cod Cliente');
  const colNomeFazenda = findCol('Nome da Fazenda', 'Fazenda');
  const colTipoNegocio = findCol('Tipo de Negócio', 'Tipo de Negocio');
  const colNumPolo = findCol('Nº Polo', 'N Polo', 'Numero Polo', 'Polo Codigo');
  const colNomePolo = findCol('Nome Polo', 'Polo');
  const colBase = findCol('Base de Carregamento', 'Base Carregamento', 'Base');
  const colPrazo = findCol('Prazo');
  const colForma = findCol('Forma');

  // Contact 1
  const colNomeCont1 = findCol('Nome do contato 1', 'Nome contato 1');
  const colFuncaoCont1 = findCol('Função do contato 1', 'Funcao do contato 1');
  const colDddCont1 = findCol('DDD do contato 1', 'DDD contato 1');
  const colNumCont1 = findCol('Número do contato 1', 'Numero do contato 1', 'Contato 1');

  // Contact 2
  const colNomeCont2 = findCol('Nome do contato 2', 'Nome contato 2');
  const colFuncaoCont2 = findCol('Função do contato 2', 'Funcao do contato 2');
  const colDddCont2 = findCol('DDD do contato 2', 'DDD contato 2');
  const colNumCont2 = findCol('Número do contato 2', 'Numero do contato 2', 'Contato 2');

  // Contact 3
  const colNomeCont3 = findCol('Nome do contato 3', 'Nome contato 3');
  const colFuncaoCont3 = findCol('Função do contato 3', 'Funcao do contato 3');
  const colDddCont3 = findCol('DDD do contato 3', 'DDD contato 3');
  const colNumCont3 = findCol('Número do contato 3', 'Numero do contato 3', 'Contato 3');

  const clients: Client[] = [];
  const regionaisSet = new Set<string>();
  const territoriesMap = new Map<string, { name: string; code?: string; regional?: string }>();
  const seenIds = new Set<string>();
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i], delimiter);
    if (!row || row.length === 0 || row.every((c) => !c)) continue;

    const getValue = (colIdx: number): string => {
      if (colIdx === -1 || colIdx >= row.length) return '';
      return fixMojibake(row[colIdx]);
    };

    const name = getValue(colNomeCliente);
    if (!name) continue; // Skip empty customer names

    const code = getValue(colCodCliente) || String(i);
    const farm = getValue(colNomeFazenda) || 'Fazenda Principal';
    const base = getValue(colBase) || 'Teresina';
    const regional = getValue(colRegional);
    const territory = getValue(colTerritorio);
    const territoryCode = getValue(colCodTerritorio);
    const businessType = getValue(colTipoNegocio);
    const poloNumber = getValue(colNumPolo);
    const poloName = getValue(colNomePolo);
    const paymentTerm = getValue(colPrazo);
    const paymentMethod = getValue(colForma);

    // Contato 1
    const cont1Name = getValue(colNomeCont1);
    const cont1Role = getValue(colFuncaoCont1);
    const cont1Ddd = getValue(colDddCont1);
    const cont1Num = getValue(colNumCont1);
    const contact1 = formatPhoneNumber(cont1Ddd, cont1Num);

    // Contato 2
    const cont2Name = getValue(colNomeCont2);
    const cont2Role = getValue(colFuncaoCont2);
    const cont2Ddd = getValue(colDddCont2);
    const cont2Num = getValue(colNumCont2);
    const contact2 = formatPhoneNumber(cont2Ddd, cont2Num);

    // Contato 3
    const cont3Name = getValue(colNomeCont3);
    const cont3Role = getValue(colFuncaoCont3);
    const cont3Ddd = getValue(colDddCont3);
    const cont3Num = getValue(colNumCont3);
    const contact3 = formatPhoneNumber(cont3Ddd, cont3Num);

    // Collect regionais and territories
    if (regional) regionaisSet.add(regional);
    if (territory) {
      territoriesMap.set(territory, {
        name: territory,
        code: territoryCode || undefined,
        regional: regional || undefined,
      });
    }

    // Build client ID ensuring absolute uniqueness across all rows
    const sanitizedNameSlug = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10)
      .toLowerCase();
    const sanitizedFarmSlug = farm
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 8)
      .toLowerCase();

    const baseId = `${source}_${code || '0'}_${sanitizedNameSlug || 'cli'}${sanitizedFarmSlug ? `_${sanitizedFarmSlug}` : ''}`;
    let id = baseId;
    let duplicateIndex = 1;
    while (seenIds.has(id)) {
      duplicateIndex++;
      id = `${baseId}_${duplicateIndex}`;
    }
    seenIds.add(id);

    clients.push({
      id,
      code,
      name,
      farm,
      base,
      regional: regional || undefined,
      territory: territory || undefined,
      territoryCode: territoryCode || undefined,
      businessType: businessType || undefined,
      poloNumber: poloNumber || undefined,
      poloName: poloName || undefined,
      paymentTerm: paymentTerm || undefined,
      paymentMethod: paymentMethod || undefined,
      contact1,
      contact1Name: cont1Name || undefined,
      contact1Role: cont1Role || undefined,
      contact1Ddd: cont1Ddd || undefined,
      contact1Number: cont1Num || undefined,
      contact2: contact2 !== '-' ? contact2 : '',
      contact2Name: cont2Name || undefined,
      contact2Role: cont2Role || undefined,
      contact2Ddd: cont2Ddd || undefined,
      contact2Number: cont2Num || undefined,
      contact3: contact3 !== '-' ? contact3 : '',
      contact3Name: cont3Name || undefined,
      contact3Role: cont3Role || undefined,
      contact3Ddd: cont3Ddd || undefined,
      contact3Number: cont3Num || undefined,
      source,
      createdAt: now,
    });
  }

  return {
    success: true,
    clients,
    detectedRegionais: Array.from(regionaisSet),
    detectedTerritories: Array.from(territoriesMap.values()),
    totalRows: clients.length,
  };
}

/**
 * Ensures that all clients in an array have strictly unique `id` values.
 * If any duplicate `id` is found (e.g. from previously loaded CSV data in localStorage),
 * a unique suffix is appended to subsequent items, preventing duplicate key errors and state bugs.
 */
export function ensureUniqueClients(clientList: Client[]): Client[] {
  if (!Array.isArray(clientList)) return [];
  const seenIds = new Set<string>();
  let hasChanges = false;

  const result = clientList.map((client, idx) => {
    let id = client.id;
    if (!id || seenIds.has(id)) {
      hasChanges = true;
      let counter = 2;
      const base = id || `cli_${idx + 1}`;
      let candidate = `${base}_${counter}`;
      while (seenIds.has(candidate)) {
        counter++;
        candidate = `${base}_${counter}`;
      }
      id = candidate;
      seenIds.add(id);
      return { ...client, id };
    }
    seenIds.add(id);
    return client;
  });

  return hasChanges ? result : clientList;
}

/**
 * Generates sample CSV text matching the user's requested specification exactly
 */
export function generateSampleCsv(source: 'mapa' | 'geradores'): string {
  const headers = [
    'Regional',
    '"Cod. Território"',
    '"Território"',
    '"Nome do Cliente"',
    '"Código do Cliente"',
    '"Nome da Fazenda"',
    '"Tipo de Negócio"',
    '"Nº Polo"',
    '"Nome Polo"',
    source === 'mapa' ? '"Base de Carregamento"' : '"Base Carregamento"',
    '"Prazo"',
    '"Forma"',
    '"Nome do contato 1 "',
    '"Função do contato 1"',
    '"DDD do contato 1"',
    '"Número do contato 1 "',
    '"Nome do contato 2"',
    '"Função do contato 2"',
    '"DDD do contato 2"',
    '"Número do contato 2"',
    '"Nome do contato 3"',
    '"Função do contato 3"',
    '"DDD do contato 3"',
    '"Número do contato 3"',
  ].join(',');

  if (source === 'mapa') {
    const row1 =
      'Araguaína,"74184","AGRO ARAG 01","AGROPECUARIA MONTE CRISTO LTDA - DEMAIS","0","FAZENDA E AGROPECUARIA MONTE CRISTO","AGRONEGÓCIO","4018","WANDERLANDIA","ARAGUAÍNA","ANTECIPADO","ANTECIPADO","MARLON","GERENTE FAZENDA","51","998080302","","","","","","","",""';
    const row2 =
      'Araguaína,"74184","AGRO ARAG 01","BENEDITO DA SILVA","74130","NOVO HORIZONTE","AGRONEGÓCIO","4012","SANTA FE","ARAGUAÍNA","ANTECIPADO","ANTECIPADO","EDUARDO","GERENTE DA FAZENDA","64","999879338","","","","","","","",""';
    return `${headers}\n${row1}\n${row2}`;
  } else {
    const row1 =
      'Norte MAPI,"61300","Geradores","AGUAS DE TERESINA SANEAMENTO SPE SA","4417","AGUAS DE TERESINA SANEAMENTO SPE SA","GERADOR","5000","GERADOR TERESINA","TERESINA","30","CARTÃO FROTA","CHRISLAYNE BOIBA","ADMINISTRATIVO","86","98106-7190","","","","","","","",""';
    const row2 =
      'Norte MAPI,"61300","Geradores","ARMAZEM MATEUS S.A","72610","ARMAZEM MATEUS - CD ALTOS","GERADOR","5000","GERADOR TERESINA","TERESINA","10","BOLETO","JOSE FILHO","Encarregado (A)","86","99580-5266","","","","","","","",""';
    return `${headers}\n${row1}\n${row2}`;
  }
}
