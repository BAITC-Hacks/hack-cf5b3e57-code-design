import type { Locale } from "../../../../shared/contract";
import type { RunStatus } from "../../../components/manager/shared/manager-types";

export type ManagerMessages = {
  navigation: { catalog: string; match: string; manager: string; brandAria: string; publicMode: string; tagline: string; aria: string; localeAria: string };
  shell: { skip: string };
  hero: { eyebrow: string; title: string; description: string; statuses: Record<RunStatus, { label: string; description: string }> };
  form: {
    section: string; title: string; category: string; city: string; date: string; event: string; budget: string;
    optional: string; duration: string; optionalPlaceholder: string; contractorLanguage: string; explanationLanguage: string;
    run: string; cancel: string; russian: string; kazakh: string; english: string;
    cities: Record<string, string>; categories: Record<string, string>; events: Record<string, string>; languages: Record<string, string>;
  };
  presets: { title: string; hint: string; items: readonly { label: string; hint: string }[] };
  pipeline: {
    section: string; title: string; live: string; emptyTitle: string; emptyDescription: string; waitingTitle: string; waitingDescription: string;
    interrupted: string; retry: string; aria: string; step: string; ai: string; code: string;
    criteriaTitle: string; criteriaDetail: (count: number) => string; filterDetail: (before: number, after: number, reason: string) => string;
    rankedTitle: string; rankedOrder: (ids: string[]) => string; rankedEmpty: string; cardTitle: (name: string) => string;
    cardDetail: (count: number) => string; criticOk: string; criticProblems: string; criticOkDetail: string; criticProblemsDetail: (count: number) => string;
    doneTitle: string; doneDetail: (outcome: string, count: number) => string;
  };
  steps: Record<string, string>;
  insights: {
    criteria: string; criteriaEmpty: string; ranking: string; rankingEmpty: string; critic: string; criticOk: string; criticEmpty: string;
  };
  funnel: { section: string; title: string; description: string; placeholder: string; result: (before: number, after: number) => string; removed: (count: number) => string; noneRemoved: string };
  cards: {
    photo: string; photoMissing: string;
    section: string; title: string; description: string; evidenceAria: string; verified: string; claimed: string; flagsAria: string;
    synthetic: string; cityImputed: string; priceImputed: string; outcomes: Record<string, { title: string; label: string }>;
  };
  factTable: { title: string; description: string; profile: string; claim: string; field: string; status: string; empty: string };
  comparison: {
    section: string; title: string; description: string; action: string; loading: string; changed: (count: number) => string;
    dropped: (names: string) => string; unchanged: string; count: (count: number) => string; onlyHere: string; cancelled: string; failed: string;
  };
  json: { title: string };
  errors: { connection: string; parse: string };
};

const ru: ManagerMessages = {
  factTable: { title: "Проверка фактов", description: "Проверено означает соответствие каталогу, включая проставленные значения. Это не независимая проверка услуг.", profile: "Подрядчик", claim: "Утверждение", field: "Поле каталога", status: "Проверка", empty: "В этом ответе нет фактов для проверки." },
  navigation: { catalog: "Каталог", match: "Подобрать", manager: "Для менеджера", brandAria: "ToiMatch — каталог", publicMode: "Открытый демо-режим", tagline: "AI-подбор с доказательствами", aria: "Основная навигация", localeAria: "Язык интерфейса" },
  shell: { skip: "Перейти к рабочей области" },
  hero: {
    eyebrow: "Рабочее место менеджера", title: "Видно каждое решение AI",
    description: "Проследите путь от критериев до проверенной карточки: фильтры, рейтинг, объяснение и критик в реальном времени.",
    statuses: {
      idle: { label: "Готов к запуску", description: "Заполните запрос или выберите демо-сценарий." },
      connecting: { label: "Подключаемся", description: "Открываем поток событий от backend." },
      running: { label: "Пайплайн работает", description: "Шаги появляются по мере обработки запроса." },
      done: { label: "Подбор завершён", description: "Ответ проверен и собран в карточки." },
      cancelled: { label: "Остановлено", description: "Поток отменён. Его можно запустить снова." },
      error: { label: "Нет соединения", description: "Проверьте backend и повторите запуск." },
    },
  },
  form: {
    section: "01", title: "Запрос на подбор", category: "Кто нужен", city: "Город", date: "Дата", event: "Событие", budget: "Бюджет, ₸",
    optional: "Дополнительные условия", duration: "Длительность, ч.", optionalPlaceholder: "Не важно", contractorLanguage: "Язык подрядчика", explanationLanguage: "Язык объяснения",
    run: "Запустить подбор", cancel: "Остановить", russian: "Русский", kazakh: "Қазақша", english: "English",
    cities: { "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Зарубежье" },
    categories: { "Ведущий": "Ведущий", "Ведущий церемонии": "Ведущий церемонии", "Фотограф": "Фотограф", "Видеограф": "Видеограф", "Флорист": "Флорист", "Декоратор": "Декоратор", "Подарки и сувениры": "Подарки и сувениры", "Инструменталист": "Инструменталист", "Лайв-бэнд": "Лайв-бэнд", "Национальный ансамбль": "Национальный ансамбль", "Танцевальный коллектив": "Танцевальный коллектив", "Шоу-программа": "Шоу-программа", "Фото и видеобудки": "Фото и видеобудки", "Банкетный зал": "Банкетный зал", "Ресторан": "Ресторан", "Загородная площадка": "Загородная площадка", "Отель": "Отель" }, events: { "свадьба": "свадьба", "той": "той", "корпоратив": "корпоратив", "конференция": "конференция", "юбилей": "юбилей", "день рождения": "день рождения" },
    languages: { "русский": "русский", "казахский": "казахский", "английский": "английский" },
  },
  presets: { title: "Демо из SCOPE", hint: "Заполняют и сразу запускают", items: [{ label: "Ведущий", hint: "Плотная категория" }, { label: "Флорист", hint: "Меньше трёх" }, { label: "Лайв-бэнд", hint: "Нет категории" }, { label: "Декоратор", hint: "Все заняты" }] },
  pipeline: {
    section: "02", title: "Поток решений", live: "SSE live", ai: "ИИ", code: "Код", emptyTitle: "Пайплайн ждёт запрос", emptyDescription: "Выберите один из четырёх сценариев — здесь появятся реальные этапы обработки без скрытого спиннера.",
    waitingTitle: "Ожидаем следующий шаг", waitingDescription: "Соединение открыто, данные приходят по мере готовности.", interrupted: "Поток прерван", retry: "Повторить", aria: "Поток событий", step: "Шаг",
    criteriaTitle: "Критерии сформированы", criteriaDetail: (count) => `${count} ориентира для этого запроса`, filterDetail: (before, after, reason) => `${before} → ${after}. ${reason}`,
    rankedTitle: "Рейтинг рассчитан", rankedOrder: (ids) => `Порядок: ${ids.join(" · ")}`, rankedEmpty: "После фильтрации кандидатов не осталось",
    cardTitle: (name) => `Карточка: ${name}`, cardDetail: (count) => `${count} факта в объяснении`, criticOk: "Критик принял объяснения", criticProblems: "Критик нашёл замечания",
    criticOkDetail: "Все утверждения опираются на факты", criticProblemsDetail: (count) => `${count} замечания`, doneTitle: "Ответ готов", doneDetail: (outcome, count) => `${outcome}: ${count} карточки`,
  },
  steps: { city: "Город", category: "Категория", date: "Свободная дата", format: "Формат события", budget: "Бюджет", language: "Язык", hours: "Длительность" },
  insights: { criteria: "На что смотрит AI", criteriaEmpty: "Критерии формируются под конкретный формат, бюджет и категорию.", ranking: "Детерминированный рейтинг", rankingEmpty: "Баллы определяют порядок, одинаковый результат решается по ID.", critic: "Проверка объяснений", criticOk: "Факты подтверждены, общие фразы не обнаружены.", criticEmpty: "Критик проверит, что каждое объяснение опирается на данные." },
  funnel: { section: "03", title: "Воронка отсева", description: "Сколько кандидатов осталось и почему остальные не прошли.", placeholder: "Воронка появится после первых шагов фильтрации.", result: (before, after) => `${before} профилей → ${after} кандидатов`, removed: (count) => `Отсеяно ${count}:`, noneRemoved: "Никто не отсеян:" },
  cards: {
    photo: "Фото: ИИ-иллюстрация", photoMissing: "Фото недоступно",
    section: "04", title: "Карточки с доказательствами", description: "Каждое утверждение помечено источником.", evidenceAria: "Факты в объяснении", verified: "Проверено", claimed: "Со слов подрядчика", flagsAria: "Особенности данных", synthetic: "Синтетический профиль", cityImputed: "Город проставлен", priceImputed: "Цена проставлена",
    outcomes: { found: { title: "Подходящие подрядчики найдены", label: "Есть результат" }, no_category_in_city: { title: "В этом городе нет такой категории", label: "Нет категории" }, all_filtered_out: { title: "Все кандидаты отсеяны условиями", label: "Все отсеяны" } },
  },
  comparison: { section: "05", title: "Один запрос — две даты", description: "Сохраним все поля формы и сравним выдачу на 16 и 23 октября. Так видно, кто выпал именно из-за занятости.", action: "Сравнить 16.10 и 23.10", loading: "Сравниваем…", changed: (count) => `Состав изменился на ${count} позиции`, dropped: (names) => `Выпали к 23 октября из-за занятости: ${names}.`, unchanged: "Никто из топа 16 октября не выпал на второй дате.", count: (count) => `${count} в выдаче`, onlyHere: "Только здесь", cancelled: "Сравнение отменено.", failed: "Не удалось сравнить две даты." },
  json: { title: "Полный JSON ответа" },
  errors: { connection: "Не удалось подключиться к пайплайну. Проверьте, что backend запущен на порту 3001.", parse: "Сервис вернул событие в неизвестном формате. Перезапустите подбор." },
};

const kk: ManagerMessages = {
  ...ru,
  factTable: { title: "Фактілерді тексеру", description: "Тексеру каталогқа, оның ішінде толықтырылған мәндерге сәйкестікті білдіреді. Бұл қызметтерді тәуелсіз тексеру емес.", profile: "Мердігер", claim: "Тұжырым", field: "Каталог өрісі", status: "Тексеру", empty: "Бұл жауапта тексеретін фактілер жоқ." },
  navigation: { catalog: "Каталог", match: "Іріктеу", manager: "Менеджерге", brandAria: "ToiMatch — каталог", publicMode: "Ашық демо-режим", tagline: "Дәлелді AI-іріктеу", aria: "Негізгі навигация", localeAria: "Интерфейс тілі" },
  shell: { skip: "Жұмыс аймағына өту" },
  hero: { eyebrow: "Менеджердің жұмыс орны", title: "AI-дың әр шешімі көрінеді", description: "Критерийлерден тексерілген карточкаға дейінгі жолды нақты уақытта бақылаңыз: сүзгілер, рейтинг, түсіндірме және критик.", statuses: {
    idle: { label: "Іске қосуға дайын", description: "Сұрауды толтырыңыз немесе демо-сценарийді таңдаңыз." }, connecting: { label: "Қосылып жатыр", description: "Backend оқиғалар ағынын ашып жатырмыз." }, running: { label: "Пайплайн жұмыс істеп тұр", description: "Қадамдар өңделу барысында пайда болады." }, done: { label: "Іріктеу аяқталды", description: "Жауап тексеріліп, карточкаларға жиналды." }, cancelled: { label: "Тоқтатылды", description: "Ағын тоқтатылды. Қайта іске қосуға болады." }, error: { label: "Байланыс жоқ", description: "Backend-ті тексеріп, қайта іске қосыңыз." },
  } },
  form: { ...ru.form, title: "Іріктеу сұрауы", category: "Кім керек", city: "Қала", date: "Күні", event: "Іс-шара", budget: "Бюджет, ₸", optional: "Қосымша шарттар", duration: "Ұзақтығы, сағ.", optionalPlaceholder: "Маңызды емес", contractorLanguage: "Мердігер тілі", explanationLanguage: "Түсіндірме тілі", run: "Іріктеуді бастау", cancel: "Тоқтату", russian: "Орысша", cities: { "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Шетел" }, categories: { "Ведущий": "Жүргізуші", "Ведущий церемонии": "Рәсім жүргізушісі", "Фотограф": "Фотограф", "Видеограф": "Видеограф", "Флорист": "Флорист", "Декоратор": "Декоратор", "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар", "Инструменталист": "Аспапшы", "Лайв-бэнд": "Лайв-бэнд", "Национальный ансамбль": "Ұлттық ансамбль", "Танцевальный коллектив": "Би ұжымы", "Шоу-программа": "Шоу-бағдарлама", "Фото и видеобудки": "Фото және видеобудкалар", "Банкетный зал": "Банкет залы", "Ресторан": "Мейрамхана", "Загородная площадка": "Қала сыртындағы алаң", "Отель": "Қонақүй" }, events: { "свадьба": "үйлену тойы", "той": "той", "корпоратив": "корпоратив", "конференция": "конференция", "юбилей": "мерейтой", "день рождения": "туған күн" }, languages: { "русский": "орысша", "казахский": "қазақша", "английский": "ағылшынша" } },
  presets: { title: "SCOPE демосы", hint: "Толтырып, бірден іске қосады", items: [{ label: "Жүргізуші", hint: "Тығыз санат" }, { label: "Флорист", hint: "Үшеуден аз" }, { label: "Лайв-бэнд", hint: "Санат жоқ" }, { label: "Декоратор", hint: "Барлығы бос емес" }] },
  pipeline: { ...ru.pipeline, ai: "ЖИ", code: "Код", title: "Шешімдер ағыны", emptyTitle: "Пайплайн сұрауды күтуде", emptyDescription: "Төрт сценарийдің бірін таңдаңыз — мұнда жасырын спиннерсіз нақты өңдеу кезеңдері көрінеді.", waitingTitle: "Келесі қадамды күтеміз", waitingDescription: "Байланыс ашық, деректер дайын болғанда келеді.", interrupted: "Ағын үзілді", retry: "Қайталау", aria: "Оқиғалар ағыны", step: "Қадам", criteriaTitle: "Критерийлер жасалды", criteriaDetail: (count) => `Осы сұрауға ${count} бағдар`, filterDetail: (before, after, reason) => `${before} → ${after}. ${reason}`, rankedTitle: "Рейтинг есептелді", rankedOrder: (ids) => `Реті: ${ids.join(" · ")}`, rankedEmpty: "Сүзгіден кейін үміткер қалмады", cardTitle: (name) => `Карточка: ${name}`, cardDetail: (count) => `Түсіндірмеде ${count} факт`, criticOk: "Критик түсіндірмелерді қабылдады", criticProblems: "Критик ескерту тапты", criticOkDetail: "Барлық тұжырым фактілерге сүйенеді", criticProblemsDetail: (count) => `${count} ескерту`, doneTitle: "Жауап дайын", doneDetail: (outcome, count) => `${outcome}: ${count} карточка` },
  steps: { city: "Қала", category: "Санат", date: "Бос күн", format: "Іс-шара форматы", budget: "Бюджет", language: "Тіл", hours: "Ұзақтық" },
  insights: { criteria: "AI нені бағалайды", criteriaEmpty: "Критерийлер формат, бюджет және санатқа сай жасалады.", ranking: "Детерминирленген рейтинг", rankingEmpty: "Ұпай реттейді, тең нәтиже ID бойынша шешіледі.", critic: "Түсіндірмені тексеру", criticOk: "Фактілер расталды, жалпы сөздер табылмады.", criticEmpty: "Критик әр түсіндірменің дерекке сүйенуін тексереді." },
  funnel: { section: "03", title: "Іріктеу воронкасы", description: "Қанша үміткер қалды және қалғандары неге өтпеді.", placeholder: "Воронка сүзгінің алғашқы қадамдарынан кейін пайда болады.", result: (before, after) => `${before} профиль → ${after} үміткер`, removed: (count) => `${count} шығарылды:`, noneRemoved: "Ешкім шығарылмады:" },
  cards: { ...ru.cards, photo: "Фото: ЖИ иллюстрациясы", photoMissing: "Фото қолжетімсіз", title: "Дәлелдері бар карточкалар", description: "Әр тұжырымның дереккөзі белгіленген.", evidenceAria: "Түсіндірмедегі фактілер", verified: "Тексерілген", claimed: "Мердігердің айтуынша", flagsAria: "Дерек ерекшеліктері", synthetic: "Синтетикалық профиль", cityImputed: "Қала толықтырылды", priceImputed: "Баға толықтырылды", outcomes: { found: { title: "Сәйкес мердігерлер табылды", label: "Нәтиже бар" }, no_category_in_city: { title: "Бұл қалада мұндай санат жоқ", label: "Санат жоқ" }, all_filtered_out: { title: "Барлық үміткер шарттардан өтпеді", label: "Барлығы шығарылды" } } },
  comparison: { section: "05", title: "Бір сұрау — екі күн", description: "Форманың барлық өрісін сақтап, 16 және 23 қазандағы нәтижені салыстырамыз. Кімнің бос еместіктен шыққаны көрінеді.", action: "16.10 және 23.10 салыстыру", loading: "Салыстырып жатырмыз…", changed: (count) => `Құрам ${count} позицияға өзгерді`, dropped: (names) => `23 қазанда бос болмағандықтан шықты: ${names}.`, unchanged: "16 қазандағы топтан екінші күні ешкім шықпады.", count: (count) => `Нәтижеде ${count}`, onlyHere: "Тек мұнда", cancelled: "Салыстыру тоқтатылды.", failed: "Екі күнді салыстыру мүмкін болмады." },
  json: { title: "Жауаптың толық JSON-ы" }, errors: { connection: "Пайплайнға қосылу мүмкін болмады. Backend 3001 портында іске қосылғанын тексеріңіз.", parse: "Сервис белгісіз форматтағы оқиға қайтарды. Іріктеуді қайта бастаңыз." },
};

const en: ManagerMessages = {
  ...ru,
  factTable: { title: "Fact verification", description: "Verified means consistent with the catalog, including imputed values. It is not an independent review of services.", profile: "Contractor", claim: "Claim", field: "Catalog field", status: "Verification", empty: "There are no facts to verify in this response." },
  navigation: { catalog: "Catalog", match: "AI matching", manager: "For managers", brandAria: "ToiMatch — catalog", publicMode: "Open demo mode", tagline: "Evidence-backed AI matching", aria: "Main navigation", localeAria: "Interface language" },
  shell: { skip: "Skip to workspace" },
  hero: { eyebrow: "Manager workspace", title: "Every AI decision is visible", description: "Follow the path from criteria to a verified card in real time: filters, ranking, explanation, and critic.", statuses: {
    idle: { label: "Ready to run", description: "Complete the request or choose a demo scenario." }, connecting: { label: "Connecting", description: "Opening the backend event stream." }, running: { label: "Pipeline is running", description: "Steps appear as the request is processed." }, done: { label: "Matching complete", description: "The response is verified and assembled into cards." }, cancelled: { label: "Stopped", description: "The stream was cancelled. You can run it again." }, error: { label: "No connection", description: "Check the backend and try again." },
  } },
  form: { ...ru.form, title: "Matching request", category: "Who do you need?", city: "City", date: "Date", event: "Event", budget: "Budget, ₸", optional: "Additional conditions", duration: "Duration, h", optionalPlaceholder: "Any", contractorLanguage: "Contractor language", explanationLanguage: "Explanation language", run: "Run matching", cancel: "Stop", russian: "Russian", kazakh: "Kazakh", english: "English", cities: { "Алматы": "Almaty", "Астана": "Astana", "Зарубежье": "International" }, categories: { "Ведущий": "Host", "Ведущий церемонии": "Ceremony host", "Фотограф": "Photographer", "Видеограф": "Videographer", "Флорист": "Florist", "Декоратор": "Decorator", "Подарки и сувениры": "Gifts and souvenirs", "Инструменталист": "Instrumentalist", "Лайв-бэнд": "Live band", "Национальный ансамбль": "National ensemble", "Танцевальный коллектив": "Dance group", "Шоу-программа": "Show program", "Фото и видеобудки": "Photo and video booths", "Банкетный зал": "Banquet hall", "Ресторан": "Restaurant", "Загородная площадка": "Country venue", "Отель": "Hotel" }, events: { "свадьба": "wedding", "той": "toi", "корпоратив": "corporate event", "конференция": "conference", "юбилей": "anniversary", "день рождения": "birthday" }, languages: { "русский": "Russian", "казахский": "Kazakh", "английский": "English" } },
  presets: { title: "SCOPE demos", hint: "Fill and run instantly", items: [{ label: "Host", hint: "Dense category" }, { label: "Florist", hint: "Fewer than three" }, { label: "Live band", hint: "No category" }, { label: "Decorator", hint: "All unavailable" }] },
  pipeline: { ...ru.pipeline, ai: "AI", code: "Code", title: "Decision stream", emptyTitle: "The pipeline is waiting", emptyDescription: "Choose one of four scenarios to see real processing stages instead of a hidden spinner.", waitingTitle: "Waiting for the next step", waitingDescription: "The connection is open; data arrives when ready.", interrupted: "Stream interrupted", retry: "Retry", aria: "Event stream", step: "Step", criteriaTitle: "Criteria generated", criteriaDetail: (count) => `${count} criteria for this request`, filterDetail: (before, after, reason) => `${before} → ${after}. ${reason}`, rankedTitle: "Ranking calculated", rankedOrder: (ids) => `Order: ${ids.join(" · ")}`, rankedEmpty: "No candidates remained after filtering", cardTitle: (name) => `Card: ${name}`, cardDetail: (count) => `${count} facts in the explanation`, criticOk: "Critic accepted the explanations", criticProblems: "Critic found issues", criticOkDetail: "Every claim is grounded in facts", criticProblemsDetail: (count) => `${count} issues`, doneTitle: "Response ready", doneDetail: (outcome, count) => `${outcome}: ${count} cards` },
  steps: { city: "City", category: "Category", date: "Availability", format: "Event format", budget: "Budget", language: "Language", hours: "Duration" },
  insights: { criteria: "What the AI checks", criteriaEmpty: "Criteria are generated for the specific format, budget, and category.", ranking: "Deterministic ranking", rankingEmpty: "Scores set the order; ties are resolved by ID.", critic: "Explanation review", criticOk: "Facts verified; no generic claims found.", criticEmpty: "The critic will ensure every explanation is grounded in data." },
  funnel: { section: "03", title: "Filtering funnel", description: "How many candidates remain and why the others were removed.", placeholder: "The funnel appears after the first filtering steps.", result: (before, after) => `${before} profiles → ${after} candidates`, removed: (count) => `${count} removed:`, noneRemoved: "Nobody removed:" },
  cards: { ...ru.cards, photo: "Photo: AI illustration", photoMissing: "Photo unavailable", title: "Evidence-backed cards", description: "Every statement is marked with its source.", evidenceAria: "Facts used in the explanation", verified: "Verified", claimed: "Contractor claim", flagsAria: "Data flags", synthetic: "Synthetic profile", cityImputed: "City imputed", priceImputed: "Price imputed", outcomes: { found: { title: "Matching contractors found", label: "Results found" }, no_category_in_city: { title: "This category is unavailable in the city", label: "No category" }, all_filtered_out: { title: "All candidates were filtered out", label: "All filtered out" } } },
  comparison: { section: "05", title: "One request, two dates", description: "We keep every form field and compare October 16 with October 23, revealing who dropped out due to availability.", action: "Compare Oct 16 and Oct 23", loading: "Comparing…", changed: (count) => `${count} positions changed`, dropped: (names) => `Unavailable on October 23: ${names}.`, unchanged: "Nobody from the October 16 top list dropped out on the second date.", count: (count) => `${count} in results`, onlyHere: "Only here", cancelled: "Comparison cancelled.", failed: "Could not compare the two dates." },
  json: { title: "Full response JSON" }, errors: { connection: "Could not connect to the pipeline. Check that the backend is running on port 3001.", parse: "The service returned an unknown event format. Restart matching." },
};

export const MANAGER_MESSAGES: Record<Locale, ManagerMessages> = { ru, kk, en };
