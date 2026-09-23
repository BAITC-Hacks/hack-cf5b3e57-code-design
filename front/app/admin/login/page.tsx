import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
};

const errorMessages: Record<string, string> = {
  fields: "Заполните email и пароль.",
  credentials: "Неверный email или пароль.",
  forbidden: "У этой учётной записи нет доступа к админ-панели.",
  session: "Сессия завершена. Войдите снова.",
  unavailable: "Сервис временно недоступен. Попробуйте ещё раз.",
  invalid: "Не удалось обработать форму. Повторите попытку.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const params = await searchParams;
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : undefined;

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="О платформе">
        <div className="brand brand--light">
          <span className="brand__mark" aria-hidden="true">
            HA
          </span>
          <span>HackAlem</span>
        </div>

        <div className="login-visual__content">
          <span className="eyebrow eyebrow--light">Control center</span>
          <h2>Каталог подрядчиков — под полным контролем.</h2>
          <p>
            Проверяйте качество данных, управляйте доступностью и следите за
            состоянием каталога в одном месте.
          </p>
        </div>

        <div className="login-visual__signal" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="login-card__kicker">Администрирование</span>
            <h1>С возвращением</h1>
            <p>Войдите с учётной записью администратора.</p>
          </div>

          {errorMessage ? (
            <div className="form-alert" role="alert">
              <span aria-hidden="true">!</span>
              {errorMessage}
            </div>
          ) : null}

          <form className="login-form" action="/api/auth/login" method="post">
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@hackalem.kz"
                maxLength={254}
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Введите пароль"
                minLength={8}
                maxLength={128}
                required
              />
            </label>

            <button className="primary-button login-form__submit" type="submit">
              Войти в панель
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="login-card__note">
            Доступ разрешён только пользователям с ролью администратора.
          </p>
        </div>
      </section>
    </main>
  );
}
