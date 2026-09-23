import type { FactKey, Locale } from "../../../../shared/contract";
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
    description: string;
  };
  presets: { title: string; hint: string; items: readonly { label: string; hint: string }[]; description: string };
  pipeline: {
    section: string; title: string; live: string; emptyTitle: string; emptyDescription: string; waitingTitle: string; waitingDescription: string;
    interrupted: string; retry: string; aria: string; step: string; ai: string; code: string;
    criteriaTitle: string; criteriaDetail: (count: number) => string; filterDetail: (before: number, after: number, reason: string) => string;
    rankedTitle: string; rankedOrder: (ids: string[]) => string; rankedEmpty: string; cardTitle: (name: string) => string;
    cardDetail: (count: number) => string; criticOk: string; criticProblems: string; criticOkDetail: string; criticProblemsDetail: (count: number) => string;
    doneTitle: string; doneDetail: (outcome: string, count: number) => string;
    description: string; liveDone: string; aiHint: string; codeHint: string;
  };
  steps: Record<string, string>;
  insights: {
    criteria: string; criteriaEmpty: string; ranking: string; rankingEmpty: string; critic: string; criticOk: string; criticEmpty: string;
    criticPassed: string; criticIssues: (count: number) => string; waiting: string; criticSkipped: string;
  };
  funnel: {
    section: string; title: string; description: string; placeholder: string; result: (before: number, after: number) => string; removed: (count: number) => string; noneRemoved: string;
    nobodyLeft: string; stepAria: (step: string, before: number, after: number) => string;
  };
  cards: {
    photo: string; photoMissing: string;
    section: string; title: string; description: string; evidenceAria: string; verified: string; claimed: string; flagsAria: string;
    synthetic: string; cityImputed: string; priceImputed: string; outcomes: Record<string, { title: string; label: string }>;
    rank: (position: number) => string; from: string; emptyHint: string; profileLink: string;
  };
  factTable: {
    title: string; description: string; profile: string; claim: string; field: string; status: string; empty: string;
    fields: Record<FactKey, string>; summary: (verified: number, total: number) => string;
  };
  comparison: {
    section: string; title: string; description: string; action: string; loading: string; changed: (count: number) => string;
    dropped: (names: string) => string; unchanged: string; count: (count: number) => string; onlyHere: string; cancelled: string; failed: string;
    empty: string; dateFilter: string;
    descriptionCurrent: string; dateLabel: string; and: string; actionDates: (dates: string) => string;
    diff: (dropped: number, added: number) => string; droppedOn: (date: string, names: string) => string;
    unchangedOn: (date: string) => string; bothEmpty: string;
  };
  json: { title: string; hint: string };
  errors: { connection: string; parse: string };
};

const ruRules = new Intl.PluralRules("ru-RU");

/** Russian noun agreement: 1 факт, 2 факта, 5 фактов. */
function ruPlural(count: number, one: string, few: string, many: string) {
  const rule = ruRules.select(count);
  if (rule === "one") return one;
  if (rule === "few") return few;
  return many;
}

function enPlural(count: number, one: string, other: string) {
  return count === 1 ? one : other;
}

const ru: ManagerMessages = {
  factTable: {
    title: "Проверка фактов",
    description: "«Проверено» — утверждение совпадает с данными каталога. Это сверка с каталогом, а не независимая проверка услуг.",
    profile: "Подрядчик", claim: "Утверждение", field: "Источник в каталоге", status: "Статус",
    empty: "В этом ответе нет фактов для проверки.",
    fields: { budget: "Цена от", format: "Форматы событий", language: "Языки", hours: "Максимум часов", date: "Календарь занятости", signal: "Особенности профиля", description: "Описание" },
    summary: (verified, total) => `Проверено ${verified} из ${total}`,
  },
  navigation: { catalog: "Каталог", match: "Подобрать", manager: "Для менеджера", brandAria: "ToiMatch — каталог", publicMode: "Открытый демо-режим", tagline: "ИИ-подбор с доказательствами", aria: "Основная навигация", localeAria: "Язык интерфейса" },
  shell: { skip: "Перейти к рабочей области" },
  hero: {
    eyebrow: "Рабочее место менеджера", title: "Видно каждое решение ИИ",
    description: "Путь от запроса до карточки в реальном времени: фильтры, рейтинг, объяснение и проверка фактов.",
    statuses: {
      idle: { label: "Готов к запуску", description: "Заполните запрос или выберите демо-сценарий." },
      connecting: { label: "Подключаемся", description: "Связываемся с сервисом подбора." },
      running: { label: "Идёт подбор", description: "Шаги появляются по мере обработки." },
      done: { label: "Подбор завершён", description: "Ответ проверен — результат и причины ниже." },
      cancelled: { label: "Остановлено", description: "Подбор прерван. Его можно запустить снова." },
      error: { label: "Нет связи", description: "Сервис подбора не ответил. Попробуйте ещё раз." },
    },
  },
  form: {
    section: "Шаг 1", title: "Запрос на подбор", description: "Кого ищем, где, когда и за какой бюджет.",
    category: "Кто нужен", city: "Город", date: "Дата", event: "Событие", budget: "Бюджет, ₸",
    optional: "Дополнительные условия", duration: "Длительность, ч", optionalPlaceholder: "Не важно", contractorLanguage: "Язык подрядчика", explanationLanguage: "Язык объяснения",
    run: "Запустить подбор", cancel: "Остановить", russian: "Русский", kazakh: "Қазақша", english: "English",
    cities: { "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Зарубежье" },
    categories: { "Ведущий": "Ведущий", "Ведущий церемонии": "Ведущий церемонии", "Фотограф": "Фотограф", "Видеограф": "Видеограф", "Флорист": "Флорист", "Декоратор": "Декоратор", "Подарки и сувениры": "Подарки и сувениры", "Инструменталист": "Инструменталист", "Лайв-бэнд": "Лайв-бэнд", "Национальный ансамбль": "Национальный ансамбль", "Танцевальный коллектив": "Танцевальный коллектив", "Шоу-программа": "Шоу-программа", "Фото и видеобудки": "Фото и видеобудки", "Банкетный зал": "Банкетный зал", "Ресторан": "Ресторан", "Загородная площадка": "Загородная площадка", "Отель": "Отель" },
    events: { "свадьба": "свадьба", "той": "той", "корпоратив": "корпоратив", "конференция": "конференция", "юбилей": "юбилей", "день рождения": "день рождения" },
    languages: { "русский": "русский", "казахский": "казахский", "английский": "английский" },
  },
  presets: {
    title: "Демо-сценарии", hint: "Заполняют форму и сразу запускают подбор",
    description: "Четыре готовых запроса показывают все исходы подбора.",
    items: [{ label: "Ведущий", hint: "Много кандидатов" }, { label: "Флорист", hint: "Найдётся меньше трёх" }, { label: "Лайв-бэнд", hint: "Нет в этом городе" }, { label: "Декоратор", hint: "Все заняты или не подходят" }],
  },
  pipeline: {
    section: "Шаг 2", title: "Ход подбора", description: "Каждый шаг появляется, как только он выполнен.",
    live: "В эфире", liveDone: "Готово", ai: "ИИ", code: "Правило",
    aiHint: "шаг выполняет модель ИИ", codeHint: "шаг выполняет код по правилам, без ИИ",
    emptyTitle: "Здесь появятся шаги подбора", emptyDescription: "Запустите подбор или выберите демо-сценарий — вместо спиннера вы увидите каждое решение.",
    waitingTitle: "Ждём следующий шаг", waitingDescription: "Данные приходят по мере готовности.", interrupted: "Подбор прерван", retry: "Повторить", aria: "Ход подбора", step: "Шаг",
    criteriaTitle: "Критерии сформированы", criteriaDetail: (count) => `${count} ${ruPlural(count, "критерий", "критерия", "критериев")} для этого запроса`,
    filterDetail: (before, after, reason) => before === 0 ? "Кандидатов не осталось" : before === after ? `Все ${after} прошли проверку` : `${before} → ${after} · ${reason}`,
    rankedTitle: "Рейтинг рассчитан", rankedOrder: (ids) => `Порядок: ${ids.join(" → ")}`, rankedEmpty: "После фильтров кандидатов не осталось",
    cardTitle: (name) => `Объяснение для ${name}`, cardDetail: (count) => `${count} ${ruPlural(count, "факт", "факта", "фактов")} в объяснении`,
    criticOk: "Проверка объяснений пройдена", criticProblems: "Проверка нашла замечания",
    criticOkDetail: "Каждое утверждение опирается на факты", criticProblemsDetail: (count) => `${count} ${ruPlural(count, "замечание", "замечания", "замечаний")}`,
    doneTitle: "Ответ готов", doneDetail: (outcome, count) => `${outcome} · ${count} ${ruPlural(count, "карточка", "карточки", "карточек")}`,
  },
  steps: { city: "Город", category: "Категория", date: "Свободная дата", format: "Формат события", budget: "Бюджет", language: "Язык", hours: "Длительность" },
  insights: {
    criteria: "На что смотрит ИИ", criteriaEmpty: "Критерии появятся под конкретный формат, бюджет и категорию.",
    ranking: "Порядок по баллам", rankingEmpty: "Порядок считает код по правилам, без случайности. При равных баллах решает номер профиля.",
    critic: "Проверка объяснений", criticOk: "Факты подтверждены, общих фраз нет.", criticEmpty: "Проверим, что каждое объяснение опирается на данные каталога.",
    criticPassed: "Пройдена", criticIssues: (count) => `${count} ${ruPlural(count, "замечание", "замечания", "замечаний")}`, waiting: "Ждём", criticSkipped: "Карточек нет — проверять нечего.",
  },
  funnel: {
    section: "Шаг 3", title: "Воронка отсева", description: "Сколько кандидатов осталось и почему остальные не прошли.",
    placeholder: "Воронка появится после первых шагов фильтрации.",
    result: (before, after) => `${before} ${ruPlural(before, "профиль", "профиля", "профилей")} → ${after} ${ruPlural(after, "кандидат", "кандидата", "кандидатов")}`,
    removed: (count) => `Отсеяно ${count}:`, noneRemoved: "Все прошли",
    nobodyLeft: "Проверять некого", stepAria: (step, before, after) => `${step}: было ${before}, осталось ${after}`,
  },
  cards: {
    photo: "Фото: ИИ-иллюстрация", photoMissing: "Фото недоступно",
    section: "Шаг 4", title: "Карточки с доказательствами", description: "Каждое утверждение помечено источником.", evidenceAria: "Факты в объяснении", verified: "Проверено", claimed: "Со слов подрядчика", flagsAria: "Особенности данных", synthetic: "Синтетический профиль", cityImputed: "Город дополнен", priceImputed: "Цена дополнена",
    outcomes: { found: { title: "Подходящие подрядчики найдены", label: "Есть результат" }, no_category_in_city: { title: "В этом городе нет такой категории", label: "Нет категории" }, all_filtered_out: { title: "Все кандидаты отсеяны условиями", label: "Все отсеяны" } },
    rank: (position) => `Место ${position}`, from: "от", emptyHint: "Попробуйте другую дату, город или бюджет — или запустите другой демо-сценарий.", profileLink: "Открыть профиль",
  },
  comparison: {
    section: "Шаг 5", title: "Один запрос — две даты", description: "Сохраним все поля формы и сравним выдачу на 16 и 23 октября. Так видно, кто выпал именно из-за занятости.",
    action: "Сравнить 16 и 23 октября", loading: "Сравниваем…",
    changed: (count) => count === 0 ? "Состав не изменился" : `Состав изменился: ${count} ${ruPlural(count, "позиция", "позиции", "позиций")}`,
    dropped: (names) => `Выпали к 23 октября из-за занятости: ${names}.`, unchanged: "Никто из подборки на 16 октября не выпал на второй дате.",
    count: (count) => `${count} в подборке`, onlyHere: "Только здесь", cancelled: "Сравнение отменено.", failed: "Не удалось сравнить две даты. Попробуйте ещё раз.",
    empty: "Подходящих подрядчиков нет", dateFilter: "Фильтр по дате",
    descriptionCurrent: "Сохраним все поля формы и сравним выдачу на двух датах. Так видно, кто выпал именно из-за занятости.",
    dateLabel: "Сравнить с датой", and: "и", actionDates: (dates) => `Сравнить ${dates}`,
    diff: (dropped, added) => `Ушли: ${dropped} · Пришли: ${added}`, droppedOn: (date, names) => `Выпали к ${date} из-за занятости: ${names}.`,
    unchangedOn: (date) => `Никто из подборки на ${date} не выпал на второй дате.`, bothEmpty: "Ни на одну из дат никто не подходит",
  },
  json: { title: "Технические данные ответа", hint: "Полный ответ сервиса — для разработчиков" },
  errors: { connection: "Не удалось связаться с сервисом подбора. Попробуйте ещё раз через минуту.", parse: "Сервис прислал непонятный ответ. Запустите подбор ещё раз." },
};

const kk: ManagerMessages = {
  ...ru,
  factTable: {
    title: "Фактілерді тексеру",
    description: "«Тексерілген» — тұжырым каталог деректерімен сәйкес келеді. Бұл каталогпен салыстыру, қызметтерді тәуелсіз тексеру емес.",
    profile: "Мердігер", claim: "Тұжырым", field: "Каталогтағы дереккөз", status: "Мәртебе",
    empty: "Бұл жауапта тексеретін фактілер жоқ.",
    fields: { budget: "Бастапқы баға", format: "Іс-шара форматтары", language: "Тілдер", hours: "Ең көп сағат", date: "Бос емес күндер", signal: "Профиль ерекшеліктері", description: "Сипаттама" },
    summary: (verified, total) => `${total} фактінің ${verified} тексерілді`,
  },
  navigation: { catalog: "Каталог", match: "Іріктеу", manager: "Менеджерге", brandAria: "ToiMatch — каталог", publicMode: "Ашық демо-режим", tagline: "Дәлелді ЖИ-іріктеу", aria: "Негізгі навигация", localeAria: "Интерфейс тілі" },
  shell: { skip: "Жұмыс аймағына өту" },
  hero: {
    eyebrow: "Менеджердің жұмыс орны", title: "ЖИ-дің әр шешімі көрінеді",
    description: "Сұраудан карточкаға дейінгі жол нақты уақытта: сүзгілер, рейтинг, түсіндірме және фактілерді тексеру.",
    statuses: {
      idle: { label: "Іске қосуға дайын", description: "Сұрауды толтырыңыз немесе демо-сценарийді таңдаңыз." },
      connecting: { label: "Қосылып жатыр", description: "Іріктеу қызметімен байланысып жатырмыз." },
      running: { label: "Іріктеу жүріп жатыр", description: "Қадамдар өңделу барысында пайда болады." },
      done: { label: "Іріктеу аяқталды", description: "Жауап тексерілді — нәтиже мен себептері төменде." },
      cancelled: { label: "Тоқтатылды", description: "Іріктеу үзілді. Қайта іске қосуға болады." },
      error: { label: "Байланыс жоқ", description: "Іріктеу қызметі жауап бермеді. Қайталап көріңіз." },
    },
  },
  form: {
    ...ru.form, section: "1-қадам", title: "Іріктеу сұрауы", description: "Кім керек, қай жерде, қашан және қандай бюджетпен.",
    category: "Кім керек", city: "Қала", date: "Күні", event: "Іс-шара", budget: "Бюджет, ₸", optional: "Қосымша шарттар", duration: "Ұзақтығы, сағ", optionalPlaceholder: "Маңызды емес", contractorLanguage: "Мердігер тілі", explanationLanguage: "Түсіндірме тілі", run: "Іріктеуді бастау", cancel: "Тоқтату", russian: "Орысша",
    cities: { "Алматы": "Алматы", "Астана": "Астана", "Зарубежье": "Шетел" },
    categories: { "Ведущий": "Жүргізуші", "Ведущий церемонии": "Рәсім жүргізушісі", "Фотограф": "Фотограф", "Видеограф": "Видеограф", "Флорист": "Флорист", "Декоратор": "Декоратор", "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар", "Инструменталист": "Аспапшы", "Лайв-бэнд": "Лайв-бэнд", "Национальный ансамбль": "Ұлттық ансамбль", "Танцевальный коллектив": "Би ұжымы", "Шоу-программа": "Шоу-бағдарлама", "Фото и видеобудки": "Фото және видеобудкалар", "Банкетный зал": "Банкет залы", "Ресторан": "Мейрамхана", "Загородная площадка": "Қала сыртындағы алаң", "Отель": "Қонақүй" },
    events: { "свадьба": "үйлену тойы", "той": "той", "корпоратив": "корпоратив", "конференция": "конференция", "юбилей": "мерейтой", "день рождения": "туған күн" },
    languages: { "русский": "орысша", "казахский": "қазақша", "английский": "ағылшынша" },
  },
  presets: {
    title: "Демо-сценарийлер", hint: "Форманы толтырып, іріктеуді бірден бастайды",
    description: "Төрт дайын сұрау іріктеудің барлық нәтижесін көрсетеді.",
    items: [{ label: "Жүргізуші", hint: "Үміткерлер көп" }, { label: "Флорист", hint: "Үшеуден аз табылады" }, { label: "Лайв-бэнд", hint: "Бұл қалада жоқ" }, { label: "Декоратор", hint: "Барлығы бос емес не сәйкес емес" }],
  },
  pipeline: {
    ...ru.pipeline, section: "2-қадам", title: "Іріктеу барысы", description: "Әр қадам орындалған сәтте пайда болады.",
    live: "Тікелей", liveDone: "Дайын", ai: "ЖИ", code: "Ереже",
    aiHint: "қадамды ЖИ моделі орындайды", codeHint: "қадамды код ережемен орындайды, ЖИ-сіз",
    emptyTitle: "Мұнда іріктеу қадамдары пайда болады", emptyDescription: "Іріктеуді бастаңыз немесе демо-сценарийді таңдаңыз — спиннердің орнына әр шешімді көресіз.",
    waitingTitle: "Келесі қадамды күтеміз", waitingDescription: "Деректер дайын болған сайын келеді.", interrupted: "Іріктеу үзілді", retry: "Қайталау", aria: "Іріктеу барысы", step: "Қадам",
    criteriaTitle: "Критерийлер жасалды", criteriaDetail: (count) => `Осы сұрауға ${count} критерий`,
    filterDetail: (before, after, reason) => before === 0 ? "Үміткер қалмады" : before === after ? `${after} үміткердің бәрі өтті` : `${before} → ${after} · ${reason}`,
    rankedTitle: "Рейтинг есептелді", rankedOrder: (ids) => `Реті: ${ids.join(" → ")}`, rankedEmpty: "Сүзгілерден кейін үміткер қалмады",
    cardTitle: (name) => `${name} үшін түсіндірме`, cardDetail: (count) => `Түсіндірмеде ${count} факт`,
    criticOk: "Түсіндірмелер тексерістен өтті", criticProblems: "Тексеру ескертулер тапты",
    criticOkDetail: "Әр тұжырым фактілерге сүйенеді", criticProblemsDetail: (count) => `${count} ескерту`,
    doneTitle: "Жауап дайын", doneDetail: (outcome, count) => `${outcome} · ${count} карточка`,
  },
  steps: { city: "Қала", category: "Санат", date: "Бос күн", format: "Іс-шара форматы", budget: "Бюджет", language: "Тіл", hours: "Ұзақтық" },
  insights: {
    criteria: "ЖИ нені бағалайды", criteriaEmpty: "Критерийлер нақты формат, бюджет және санатқа сай жасалады.",
    ranking: "Ұпай бойынша рет", rankingEmpty: "Ретті код ережемен есептейді, кездейсоқтық жоқ. Ұпай тең болса, профиль нөмірі шешеді.",
    critic: "Түсіндірмені тексеру", criticOk: "Фактілер расталды, жалпы сөздер жоқ.", criticEmpty: "Әр түсіндірменің каталог деректеріне сүйенетінін тексереміз.",
    criticPassed: "Өтті", criticIssues: (count) => `${count} ескерту`, waiting: "Күтуде", criticSkipped: "Карточка жоқ — тексеретін ештеңе жоқ.",
  },
  funnel: {
    section: "3-қадам", title: "Іріктеу воронкасы", description: "Қанша үміткер қалды және қалғандары неге өтпеді.",
    placeholder: "Воронка сүзгінің алғашқы қадамдарынан кейін пайда болады.",
    result: (before, after) => `${before} профиль → ${after} үміткер`, removed: (count) => `${count} шығарылды:`, noneRemoved: "Бәрі өтті",
    nobodyLeft: "Тексеретін ешкім қалмады", stepAria: (step, before, after) => `${step}: ${before} болды, ${after} қалды`,
  },
  cards: {
    ...ru.cards, section: "4-қадам", photo: "Фото: ЖИ-иллюстрация", photoMissing: "Фото қолжетімсіз", title: "Дәлелдері бар карточкалар", description: "Әр тұжырымның дереккөзі белгіленген.", evidenceAria: "Түсіндірмедегі фактілер", verified: "Тексерілген", claimed: "Мердігердің айтуынша", flagsAria: "Дерек ерекшеліктері", synthetic: "Синтетикалық профиль", cityImputed: "Қала толықтырылды", priceImputed: "Баға толықтырылды",
    outcomes: { found: { title: "Сәйкес мердігерлер табылды", label: "Нәтиже бар" }, no_category_in_city: { title: "Бұл қалада мұндай санат жоқ", label: "Санат жоқ" }, all_filtered_out: { title: "Барлық үміткер шарттардан өтпеді", label: "Барлығы шықты" } },
    rank: (position) => `${position}-орын`, from: "бастап", emptyHint: "Басқа күнді, қаланы не бюджетті таңдап көріңіз — немесе басқа демо-сценарийді іске қосыңыз.", profileLink: "Профильді ашу",
  },
  comparison: {
    section: "5-қадам", title: "Бір сұрау — екі күн", description: "Форманың барлық өрісін сақтап, 16 және 23 қазандағы нәтижені салыстырамыз. Кімнің бос еместіктен шыққаны көрінеді.",
    action: "16 және 23 қазанды салыстыру", loading: "Салыстырып жатырмыз…",
    changed: (count) => count === 0 ? "Құрам өзгерген жоқ" : `Құрам өзгерді: ${count} позиция`,
    dropped: (names) => `23 қазанда бос болмағандықтан шықты: ${names}.`, unchanged: "16 қазандағы іріктеуден екінші күні ешкім шықпады.",
    count: (count) => `Іріктеуде ${count}`, onlyHere: "Тек мұнда", cancelled: "Салыстыру тоқтатылды.", failed: "Екі күнді салыстыру мүмкін болмады. Қайталап көріңіз.",
    empty: "Сәйкес мердігерлер жоқ", dateFilter: "Күн бойынша сүзгі",
    descriptionCurrent: "Форманың барлық өрісін сақтап, екі күндегі нәтижені салыстырамыз. Кімнің бос еместіктен шыққаны көрінеді.",
    dateLabel: "Салыстыратын күн", and: "және", actionDates: (dates) => `${dates} күндерін салыстыру`,
    diff: (dropped, added) => `Шықты: ${dropped} · Кірді: ${added}`, droppedOn: (date, names) => `${date} бос болмағандықтан шықты: ${names}.`,
    unchangedOn: (date) => `${date} іріктеуден екінші күні ешкім шықпады.`, bothEmpty: "Екі күнге де ешкім сәйкес келмейді",
  },
  json: { title: "Жауаптың техникалық деректері", hint: "Қызметтің толық жауабы — әзірлеушілерге" },
  errors: { connection: "Іріктеу қызметімен байланысу мүмкін болмады. Бір минуттан кейін қайталап көріңіз.", parse: "Қызмет түсініксіз жауап жіберді. Іріктеуді қайта бастаңыз." },
};

const en: ManagerMessages = {
  ...ru,
  factTable: {
    title: "Fact check",
    description: "“Verified” means the claim matches catalog data. It is a check against the catalog, not an independent review of services.",
    profile: "Contractor", claim: "Claim", field: "Catalog source", status: "Status",
    empty: "There are no facts to check in this response.",
    fields: { budget: "Starting price", format: "Event formats", language: "Languages", hours: "Maximum hours", date: "Availability calendar", signal: "Profile highlights", description: "Description" },
    summary: (verified, total) => `${verified} of ${total} verified`,
  },
  navigation: { catalog: "Catalog", match: "Find a match", manager: "For managers", brandAria: "ToiMatch — catalog", publicMode: "Open demo mode", tagline: "Evidence-backed AI matching", aria: "Main navigation", localeAria: "Interface language" },
  shell: { skip: "Skip to workspace" },
  hero: {
    eyebrow: "Manager workspace", title: "Every AI decision is visible",
    description: "Follow the request to the final card in real time: filters, ranking, explanation, and fact check.",
    statuses: {
      idle: { label: "Ready to run", description: "Fill in the request or pick a demo scenario." },
      connecting: { label: "Connecting", description: "Reaching the matching service." },
      running: { label: "Matching in progress", description: "Steps appear as they are processed." },
      done: { label: "Matching complete", description: "The response is checked — results and reasons are below." },
      cancelled: { label: "Stopped", description: "Matching was stopped. You can run it again." },
      error: { label: "No connection", description: "The matching service did not respond. Try again." },
    },
  },
  form: {
    ...ru.form, section: "Step 1", title: "Matching request", description: "Who, where, when, and for what budget.",
    category: "Who do you need?", city: "City", date: "Date", event: "Event", budget: "Budget, ₸", optional: "Additional conditions", duration: "Duration, h", optionalPlaceholder: "Any", contractorLanguage: "Contractor language", explanationLanguage: "Explanation language", run: "Run matching", cancel: "Stop", russian: "Russian", kazakh: "Kazakh", english: "English",
    cities: { "Алматы": "Almaty", "Астана": "Astana", "Зарубежье": "International" },
    categories: { "Ведущий": "Host", "Ведущий церемонии": "Ceremony host", "Фотограф": "Photographer", "Видеограф": "Videographer", "Флорист": "Florist", "Декоратор": "Decorator", "Подарки и сувениры": "Gifts and souvenirs", "Инструменталист": "Instrumentalist", "Лайв-бэнд": "Live band", "Национальный ансамбль": "National ensemble", "Танцевальный коллектив": "Dance group", "Шоу-программа": "Show program", "Фото и видеобудки": "Photo and video booths", "Банкетный зал": "Banquet hall", "Ресторан": "Restaurant", "Загородная площадка": "Country venue", "Отель": "Hotel" },
    events: { "свадьба": "wedding", "той": "toi", "корпоратив": "corporate event", "конференция": "conference", "юбилей": "anniversary", "день рождения": "birthday" },
    languages: { "русский": "Russian", "казахский": "Kazakh", "английский": "English" },
  },
  presets: {
    title: "Demo scenarios", hint: "Fill in the form and run matching instantly",
    description: "Four ready-made requests cover every matching outcome.",
    items: [{ label: "Host", hint: "Plenty of candidates" }, { label: "Florist", hint: "Fewer than three found" }, { label: "Live band", hint: "Not in this city" }, { label: "Decorator", hint: "All booked or unsuitable" }],
  },
  pipeline: {
    ...ru.pipeline, section: "Step 2", title: "Matching progress", description: "Each step appears as soon as it is done.",
    live: "Live", liveDone: "Done", ai: "AI", code: "Rule",
    aiHint: "step performed by the AI model", codeHint: "step performed by rule-based code, no AI",
    emptyTitle: "Matching steps will appear here", emptyDescription: "Run matching or pick a demo scenario — instead of a spinner you will see every decision.",
    waitingTitle: "Waiting for the next step", waitingDescription: "Data arrives as soon as it is ready.", interrupted: "Matching interrupted", retry: "Retry", aria: "Matching progress", step: "Step",
    criteriaTitle: "Criteria generated", criteriaDetail: (count) => `${count} ${enPlural(count, "criterion", "criteria")} for this request`,
    filterDetail: (before, after, reason) => before === 0 ? "No candidates left" : before === after ? `All ${after} passed` : `${before} → ${after} · ${reason}`,
    rankedTitle: "Ranking calculated", rankedOrder: (ids) => `Order: ${ids.join(" → ")}`, rankedEmpty: "No candidates remained after filtering",
    cardTitle: (name) => `Explanation for ${name}`, cardDetail: (count) => `${count} ${enPlural(count, "fact", "facts")} in the explanation`,
    criticOk: "Explanation check passed", criticProblems: "The check found issues",
    criticOkDetail: "Every claim is grounded in facts", criticProblemsDetail: (count) => `${count} ${enPlural(count, "issue", "issues")}`,
    doneTitle: "Response ready", doneDetail: (outcome, count) => `${outcome} · ${count} ${enPlural(count, "card", "cards")}`,
  },
  steps: { city: "City", category: "Category", date: "Availability", format: "Event format", budget: "Budget", language: "Language", hours: "Duration" },
  insights: {
    criteria: "What the AI checks", criteriaEmpty: "Criteria are generated for the specific format, budget, and category.",
    ranking: "Order by score", rankingEmpty: "Rule-based code sets the order, with no randomness. Ties are resolved by profile number.",
    critic: "Explanation check", criticOk: "Facts confirmed; no generic claims.", criticEmpty: "We check that every explanation is grounded in catalog data.",
    criticPassed: "Passed", criticIssues: (count) => `${count} ${enPlural(count, "issue", "issues")}`, waiting: "Waiting", criticSkipped: "No cards, so there is nothing to check.",
  },
  funnel: {
    section: "Step 3", title: "Filtering funnel", description: "How many candidates remain and why the others were removed.",
    placeholder: "The funnel appears after the first filtering steps.",
    result: (before, after) => `${before} ${enPlural(before, "profile", "profiles")} → ${after} ${enPlural(after, "candidate", "candidates")}`,
    removed: (count) => `${count} removed:`, noneRemoved: "All passed",
    nobodyLeft: "Nobody left to check", stepAria: (step, before, after) => `${step}: ${before} before, ${after} left`,
  },
  cards: {
    ...ru.cards, section: "Step 4", photo: "Photo: AI illustration", photoMissing: "Photo unavailable", title: "Evidence-backed cards", description: "Every statement is marked with its source.", evidenceAria: "Facts used in the explanation", verified: "Verified", claimed: "Contractor’s claim", flagsAria: "Data notes", synthetic: "Synthetic profile", cityImputed: "City filled in", priceImputed: "Price filled in",
    outcomes: { found: { title: "Matching contractors found", label: "Results found" }, no_category_in_city: { title: "This category is not available in the city", label: "No category" }, all_filtered_out: { title: "All candidates were filtered out", label: "All filtered out" } },
    rank: (position) => `Rank ${position}`, from: "from", emptyHint: "Try another date, city, or budget — or run a different demo scenario.", profileLink: "Open profile",
  },
  comparison: {
    section: "Step 5", title: "One request, two dates", description: "We keep every form field and compare October 16 with October 23 to show who dropped out because of availability.",
    action: "Compare October 16 and 23", loading: "Comparing…",
    changed: (count) => count === 0 ? "The line-up did not change" : `The line-up changed: ${count} ${enPlural(count, "position", "positions")}`,
    dropped: (names) => `Unavailable on October 23: ${names}.`, unchanged: "Nobody from the October 16 selection dropped out on the second date.",
    count: (count) => `${count} selected`, onlyHere: "Only here", cancelled: "Comparison cancelled.", failed: "Could not compare the two dates. Please try again.",
    empty: "No suitable contractors", dateFilter: "Date filter",
    descriptionCurrent: "We keep every form field and compare two dates to show who dropped out because of availability.",
    dateLabel: "Compare with date", and: "and", actionDates: (dates) => `Compare ${dates}`,
    diff: (dropped, added) => `Dropped: ${dropped} · Added: ${added}`, droppedOn: (date, names) => `Unavailable on ${date}: ${names}.`,
    unchangedOn: (date) => `Nobody from the ${date} selection dropped out on the second date.`, bothEmpty: "Nobody matches on either date",
  },
  json: { title: "Technical response data", hint: "The full service response — for developers" },
  errors: { connection: "Could not reach the matching service. Please try again in a minute.", parse: "The service sent an unexpected response. Run matching again." },
};

export const MANAGER_MESSAGES: Record<Locale, ManagerMessages> = { ru, kk, en };
