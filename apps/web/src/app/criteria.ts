import { ParamMap } from '@angular/router';

export type CatalogueCriteria = {
  search: string;
  status: string[];
  applicationArea: string[];
  sort: string;
};

export const ALLOWED_STATUSES = [
  'ACTIVE',
  'PHASE_OUT',
  'DISCONTINUED',
  'UNAVAILABLE',
];

export function initialCriteria(): CatalogueCriteria {
  return {
    search: '',
    status: [],
    applicationArea: [],
    sort: 'name',
  };
}

export function parseCriteria(params: ParamMap): {
  criteria: CatalogueCriteria;
  hasWarning: boolean;
} {
  let hasWarning = false;

  const rawSearches = params.getAll('search');
  let search = '';
  if (
    rawSearches.length > 1 ||
    (rawSearches.length === 1 && rawSearches[0].length > 200)
  ) {
    hasWarning = true;
    search = '';
  } else if (rawSearches.length === 1) {
    search = rawSearches[0].trim();
  }

  const rawSorts = params.getAll('sort');
  let sort = 'name';
  if (
    rawSorts.length > 1 ||
    (rawSorts.length === 1 && !['name', 'name-desc'].includes(rawSorts[0]))
  ) {
    hasWarning = true;
    sort = 'name';
  } else if (rawSorts.length === 1) {
    sort = rawSorts[0];
  }

  const rawStatuses = params.getAll('status');
  if (rawStatuses.some((s) => !ALLOWED_STATUSES.includes(s))) {
    hasWarning = true;
  }
  const status = [
    ...new Set(rawStatuses.filter((s) => ALLOWED_STATUSES.includes(s))),
  ];

  const rawAreas = params.getAll('applicationArea');
  if (rawAreas.some((a) => !a.trim())) {
    hasWarning = true;
  }
  const applicationArea = [
    ...new Set(rawAreas.map((a) => a.trim()).filter((a) => Boolean(a))),
  ];

  return {
    criteria: {
      search,
      status,
      applicationArea,
      sort,
    },
    hasWarning,
  };
}

export function criteriaToQueryParams(
  criteria: CatalogueCriteria,
): Record<string, string | string[] | null> {
  return {
    search: criteria.search || null,
    status: criteria.status.length ? criteria.status : null,
    applicationArea: criteria.applicationArea.length
      ? criteria.applicationArea
      : null,
    sort: criteria.sort === 'name' ? null : criteria.sort,
  };
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Active',
    PHASE_OUT: 'Phase-out',
    DISCONTINUED: 'Discontinued',
    UNAVAILABLE: 'Unavailable',
    UNKNOWN: 'Unavailable',
  };
  return map[status] || status;
}

export function displayStatus(product: {
  status: string;
  presentInLatestImport?: boolean;
}): string {
  if (product.presentInLatestImport === false) return 'Unavailable';
  return statusLabel(product.status);
}

export function statusSeverity(product: {
  status: string;
  presentInLatestImport?: boolean;
}): 'secondary' | 'warn' | 'danger' {
  if (product.presentInLatestImport === false) return 'secondary';
  if (product.status === 'PHASE_OUT') return 'warn';
  if (product.status === 'DISCONTINUED') return 'danger';
  return 'secondary';
}

export function isUnavailable(product: {
  status: string;
  presentInLatestImport?: boolean;
}): boolean {
  return (
    product.presentInLatestImport === false ||
    product.status === 'UNAVAILABLE' ||
    product.status === 'UNKNOWN'
  );
}

export function availabilityExplanation(product: {
  status: string;
  presentInLatestImport?: boolean;
}): string | null {
  if (product.presentInLatestImport === false) {
    return 'This product is absent from the latest catalogue import.';
  }
  if (product.status === 'UNKNOWN') {
    return 'Product availability is unconfirmed.';
  }
  return null;
}
