"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <div className="error-card">
        <span className="error-card__code">503</span>
        <h1>Не удалось загрузить панель</h1>
        <p>
          Проверьте подключение к API и повторите попытку. Ваша сессия и данные
          не изменены.
        </p>
        <button className="primary-button" type="button" onClick={reset}>
          Попробовать снова
        </button>
      </div>
    </main>
  );
}
