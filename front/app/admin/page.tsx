import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { SVGProps } from "react";

import { StatusToggle } from "@/components/admin/status-toggle";
import {
  AdminApiError,
  type Contractor,
  type ContractorFilters,
  getAdminDashboard,
} from "@/lib/admin-api";

export const metadata: Metadata = {
  title: "Обзор",
};

type IconProps = SVGProps<SVGSVGElement>;

function DashboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />
    </svg>
  );
}

function PeopleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1.7a3.3 3.3 0 0 0-2.5-3.2M15.3 4.6a3.5 3.5 0 0 1 0 6.8" />
    </svg>
  );
}

function ChartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function DatabaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}

function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3c.7 4.7 3.3 7.3 8 8-4.7.7-7.3 3.3-8 8-.7-4.7-3.3-7.3-8-8 4.7-.7 7.3-3.3 8-8Z" />
    </svg>
  );
}

function WalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 7.5V6a2 2 0 0 1 2-2h12v3.5M4 7.5h15a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a2 2 0 0 1 1-2Z" />
      <path d="M17 12h4v4h-4a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function LogoutIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5M14 8l4 4-4 4m4-4H9" />
    </svg>
  );
}

function ChevronIcon({ direction, ...props }: IconProps & { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanFilter(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, 100) : undefined;
}

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ContractorFilters {
  const rawStatus = getSingleParam(params.status);
  const status =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";
  const rawPage = Number.parseInt(getSingleParam(params.page) ?? "1", 10);

  return {
    search: cleanFilter(getSingleParam(params.search)),
    city: cleanFilter(getSingleParam(params.city)),
    category: cleanFilter(getSingleParam(params.category)),
    status,
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: 12,
  };
}

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
}

function getPageHref(filters: ContractorFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.city) params.set("city", filters.city);
  if (filters.category) params.set("category", filters.category);
  if (filters.status !== "all") params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

function ProvenanceBadges({ contractor }: { contractor: Contractor }) {
  const hasFlags =
    contractor.synthetic || contractor.cityImputed || contractor.priceImputed;

  if (!hasFlags) {
    return <span className="data-clean">Исходные данные</span>;
  }

  return (
    <div className="provenance-list">
      {contractor.synthetic ? (
        <span className="provenance-badge provenance-badge--synthetic">
          synthetic
        </span>
      ) : null}
      {contractor.cityImputed ? (
        <span className="provenance-badge">city imputed</span>
      ) : null}
      {contractor.priceImputed ? (
        <span className="provenance-badge">price imputed</span>
      ) : null}
    </div>
  );
}

function MiniBars({
  items,
  emptyLabel,
}: {
  items: Array<{ name: string; count: number }>;
  emptyLabel: string;
}) {
  const visibleItems = items.slice(0, 5);
  const max = Math.max(...visibleItems.map((item) => item.count), 1);

  if (!visibleItems.length) {
    return <p className="mini-bars__empty">{emptyLabel}</p>;
  }

  return (
    <div className="mini-bars">
      {visibleItems.map((item) => (
        <div className="mini-bar" key={item.name}>
          <div className="mini-bar__label">
            <span>{item.name}</span>
            <strong>{item.count}</strong>
          </div>
          <span className="mini-bar__track" aria-hidden="true">
            <span style={{ width: `${Math.max((item.count / max) * 100, 5)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const result = await getAdminDashboard(filters).then(
    (data) => ({ ok: true as const, data }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  if (!result.ok) {
    if (
      result.error instanceof AdminApiError &&
      (result.error.status === 401 || result.error.status === 403)
    ) {
      redirect("/admin/login?error=session");
    }

    throw result.error;
  }

  const { overview, contractors } = result.data;
  const activeRate = overview.totalContractors
    ? Math.round((overview.activeContractors / overview.totalContractors) * 100)
    : 0;
  const generatedCount =
    overview.syntheticContractors +
    overview.cityImputedContractors +
    overview.priceImputedContractors;
  const today = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Перейти к содержимому
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            HA
          </span>
          <span>HackAlem</span>
        </div>

        <nav className="sidebar__nav" aria-label="Навигация администратора">
          <a className="nav-item nav-item--active" href="#overview">
            <DashboardIcon />
            <span>Обзор</span>
          </a>
          <a className="nav-item" href="#contractors">
            <PeopleIcon />
            <span>Подрядчики</span>
            <span className="nav-item__count">{overview.totalContractors}</span>
          </a>
          <a className="nav-item" href="#analytics">
            <ChartIcon />
            <span>Аналитика</span>
          </a>
        </nav>

        <div className="sidebar__footer">
          <div className="admin-identity">
            <span className="admin-identity__avatar">A</span>
            <span>
              <strong>Администратор</strong>
              <small>Полный доступ</small>
            </span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="logout-button" type="submit">
              <LogoutIcon />
              <span>Выйти</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-content">
        <header className="mobile-header">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">HA</span>
            <span>HackAlem</span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="icon-button" type="submit" aria-label="Выйти">
              <LogoutIcon />
            </button>
          </form>
        </header>

        <main className="admin-main" id="admin-main">
          <section className="page-heading" id="overview">
            <div>
              <span className="eyebrow">{today}</span>
              <h1>Панель управления</h1>
              <p>Состояние каталога и качество данных — в реальном времени.</p>
            </div>
            <div className="system-status">
              <span className="system-status__dot" aria-hidden="true" />
              API подключён
            </div>
          </section>

          <section className="stats-grid" aria-label="Ключевые показатели">
            <article className="stat-card stat-card--primary">
              <span className="stat-card__icon"><DatabaseIcon /></span>
              <div>
                <span className="stat-card__label">Всего подрядчиков</span>
                <strong>{overview.totalContractors}</strong>
                <small>записей в каталоге</small>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-card__icon stat-card__icon--green"><CheckIcon /></span>
              <div>
                <span className="stat-card__label">Активны</span>
                <strong>{overview.activeContractors}</strong>
                <small>{activeRate}% каталога доступно</small>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-card__icon stat-card__icon--amber"><PeopleIcon /></span>
              <div>
                <span className="stat-card__label">Неактивны</span>
                <strong>{overview.inactiveContractors}</strong>
                <small>скрыты из подбора</small>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-card__icon stat-card__icon--violet"><SparkleIcon /></span>
              <div>
                <span className="stat-card__label">С обогащением</span>
                <strong>{generatedCount}</strong>
                <small>provenance-меток</small>
              </div>
            </article>
          </section>

          <section className="insights-grid" id="analytics">
            <article className="panel quality-panel">
              <div className="panel__heading">
                <div>
                  <span className="eyebrow">Data health</span>
                  <h2>Качество данных</h2>
                </div>
                <span className="panel__icon"><SparkleIcon /></span>
              </div>
              <div className="quality-grid">
                <div><strong>{overview.syntheticContractors}</strong><span>synthetic</span></div>
                <div><strong>{overview.cityImputedContractors}</strong><span>city imputed</span></div>
                <div><strong>{overview.priceImputedContractors}</strong><span>price imputed</span></div>
                <div><strong>{overview.missingMaxHoursContractors}</strong><span>без max hours</span></div>
              </div>
            </article>

            <article className="panel price-panel">
              <div className="panel__heading">
                <div>
                  <span className="eyebrow">Стоимость</span>
                  <h2>Диапазон цен</h2>
                </div>
                <span className="panel__icon panel__icon--blue"><WalletIcon /></span>
              </div>
              <strong className="price-panel__average">
                {formatMoney(overview.priceFromKzt.average)}
              </strong>
              <span className="price-panel__caption">средняя стартовая цена</span>
              <div className="price-range">
                <span><small>Минимум</small>{formatMoney(overview.priceFromKzt.min)}</span>
                <span><small>Максимум</small>{formatMoney(overview.priceFromKzt.max)}</span>
              </div>
            </article>

            <article className="panel distribution-panel">
              <div className="panel__heading">
                <div>
                  <span className="eyebrow">География</span>
                  <h2>По городам</h2>
                </div>
              </div>
              <MiniBars items={overview.byCity} emptyLabel="Нет данных по городам" />
            </article>

            <article className="panel distribution-panel">
              <div className="panel__heading">
                <div>
                  <span className="eyebrow">Спрос</span>
                  <h2>По категориям</h2>
                </div>
              </div>
              <MiniBars items={overview.byCategory} emptyLabel="Нет данных по категориям" />
            </article>
          </section>

          <section className="contractors-section" id="contractors">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Каталог</span>
                <h2>Подрядчики</h2>
                <p>{contractors.pagination.total} записей по текущим фильтрам</p>
              </div>
            </div>

            <form className="filters" action="/admin" method="get">
              <label className="filter-search">
                <span className="sr-only">Поиск подрядчика</span>
                <SearchIcon />
                <input
                  type="search"
                  name="search"
                  defaultValue={filters.search}
                  placeholder="Имя или ID..."
                />
              </label>
              <label className="filter-select">
                <span className="sr-only">Город</span>
                <select name="city" defaultValue={filters.city ?? ""}>
                  <option value="">Все города</option>
                  {overview.byCity.map((item) => (
                    <option value={item.name} key={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="filter-select">
                <span className="sr-only">Категория</span>
                <select name="category" defaultValue={filters.category ?? ""}>
                  <option value="">Все категории</option>
                  {overview.byCategory.map((item) => (
                    <option value={item.name} key={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="filter-select">
                <span className="sr-only">Статус</span>
                <select name="status" defaultValue={filters.status}>
                  <option value="all">Любой статус</option>
                  <option value="active">Активные</option>
                  <option value="inactive">Неактивные</option>
                </select>
              </label>
              <button className="filter-button" type="submit">Применить</button>
              <Link className="reset-link" href="/admin">Сбросить</Link>
            </form>

            {contractors.items.length ? (
              <>
                <div className="contractors-table-wrap">
                  <table className="contractors-table">
                    <thead>
                      <tr>
                        <th scope="col">Подрядчик</th>
                        <th scope="col">Категории</th>
                        <th scope="col">Город</th>
                        <th scope="col">Цена от</th>
                        <th scope="col">Доступность</th>
                        <th scope="col">Источник</th>
                        <th scope="col">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractors.items.map((contractor) => (
                        <tr key={contractor.id}>
                          <td>
                            <div className="contractor-name">
                              <span className="contractor-avatar">
                                {contractor.anonName.slice(0, 2).toUpperCase()}
                              </span>
                              <span>
                                <strong>{contractor.anonName}</strong>
                                <small>ID {contractor.id}</small>
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="tag-list">
                              {contractor.categories.slice(0, 2).map((category) => (
                                <span className="category-tag" key={category}>{category}</span>
                              ))}
                              {contractor.categories.length > 2 ? (
                                <span className="more-tag">+{contractor.categories.length - 2}</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className="city-cell">{contractor.city || "—"}</span>
                          </td>
                          <td>
                            <strong className="price-cell">{formatMoney(contractor.priceFromKzt)}</strong>
                          </td>
                          <td>
                            <span className="availability-cell">
                              {contractor.maxHours === null ? "Не указано" : `до ${contractor.maxHours} ч.`}
                              <small>{contractor.busyDates.length} занятых дат</small>
                            </span>
                          </td>
                          <td><ProvenanceBadges contractor={contractor} /></td>
                          <td>
                            <StatusToggle
                              key={`desktop-${contractor.id}-${contractor.isActive}`}
                              contractorId={contractor.id}
                              contractorName={contractor.anonName}
                              initialActive={contractor.isActive}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="contractor-cards">
                  {contractors.items.map((contractor) => (
                    <article className="contractor-card" key={contractor.id}>
                      <div className="contractor-card__header">
                        <div className="contractor-name">
                          <span className="contractor-avatar">
                            {contractor.anonName.slice(0, 2).toUpperCase()}
                          </span>
                          <span>
                            <strong>{contractor.anonName}</strong>
                            <small>{contractor.city || "Город не указан"} · ID {contractor.id}</small>
                          </span>
                        </div>
                        <StatusToggle
                          key={`mobile-${contractor.id}-${contractor.isActive}`}
                          contractorId={contractor.id}
                          contractorName={contractor.anonName}
                          initialActive={contractor.isActive}
                        />
                      </div>
                      <div className="tag-list">
                        {contractor.categories.map((category) => (
                          <span className="category-tag" key={category}>{category}</span>
                        ))}
                      </div>
                      <dl className="contractor-card__facts">
                        <div><dt>Цена от</dt><dd>{formatMoney(contractor.priceFromKzt)}</dd></div>
                        <div><dt>Лимит</dt><dd>{contractor.maxHours === null ? "—" : `${contractor.maxHours} ч.`}</dd></div>
                        <div><dt>Форматы</dt><dd>{contractor.eventFormats.join(", ") || "—"}</dd></div>
                        <div><dt>Языки</dt><dd>{contractor.languages.join(", ") || "—"}</dd></div>
                      </dl>
                      <ProvenanceBadges contractor={contractor} />
                    </article>
                  ))}
                </div>

                <nav className="pagination" aria-label="Пагинация подрядчиков">
                  {contractors.pagination.page > 1 ? (
                    <Link
                      className="pagination__button"
                      href={getPageHref(filters, contractors.pagination.page - 1)}
                      aria-label="Предыдущая страница"
                    >
                      <ChevronIcon direction="left" />
                    </Link>
                  ) : (
                    <span className="pagination__button pagination__button--disabled" aria-disabled="true"><ChevronIcon direction="left" /></span>
                  )}
                  <span className="pagination__label">
                    Страница <strong>{contractors.pagination.page}</strong> из {Math.max(contractors.pagination.totalPages, 1)}
                  </span>
                  {contractors.pagination.page < contractors.pagination.totalPages ? (
                    <Link
                      className="pagination__button"
                      href={getPageHref(filters, contractors.pagination.page + 1)}
                      aria-label="Следующая страница"
                    >
                      <ChevronIcon direction="right" />
                    </Link>
                  ) : (
                    <span className="pagination__button pagination__button--disabled" aria-disabled="true"><ChevronIcon direction="right" /></span>
                  )}
                </nav>
              </>
            ) : (
              <div className="empty-state">
                <span className="empty-state__icon"><SearchIcon /></span>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить или сбросить фильтры.</p>
                <Link className="primary-button" href="/admin">Сбросить фильтры</Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
