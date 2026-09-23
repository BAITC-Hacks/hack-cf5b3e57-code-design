import type { Locale } from "../../../../shared/contract";
import type { MatchMessages } from "./match";
import { MATCH_MESSAGES } from "./match";

export type ChatField =
  | "category"
  | "city"
  | "date"
  | "eventType"
  | "budgetKzt"
  | "language";

interface FieldCopy {
  label: string;
  prompt: string;
  placeholder: string;
}

export interface ChatMessages {
  pageTitle: string;
  pageDescription: string;
  brand: string;
  brandAria: string;
  navigationAria: string;
  nav: {
    catalog: string;
    match: string;
    chat: string;
    manager: string;
  };
  localeLabel: string;
  skip: string;
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    badge: string;
  };
  modes: Record<"search" | "bundle", { label: string; description: string }> & {
    label: string;
  };
  session: {
    eyebrow: string;
    title: string;
    id: string;
    status: Record<"starting" | "ready" | "streaming" | "error", string>;
    statusDescription: Record<"starting" | "ready" | "streaming" | "error", string>;
  };
  tools: Record<"search_contractors" | "build_event_bundle", string>;
  starterPrompts: Record<"search" | "bundle", readonly string[]>;
  /** Human-friendly labels for starterPrompts (same order). The prompt value is what is sent. */
  starterLabels: Record<"search" | "bundle", readonly string[]>;
  fields: Record<ChatField, FieldCopy>;
  progress: {
    eyebrow: string;
    title: string;
    complete: string;
    pending: string;
    edit: string;
    optional: string;
  };
  assistant: {
    name: string;
    label: string;
    greeting: string;
    transparency: string;
    understood: string;
    changed: string;
    searching: string;
    resultReady: string;
    attachmentReady: string;
    noRecognition: string;
    invalidDate: string;
    invalidBudget: string;
    restarted: string;
    error: string;
  };
  composer: {
    label: string;
    send: string;
    sending: string;
    hint: string;
    placeholder: string;
  };
  actions: {
    anyLanguage: string;
    restart: string;
    change: string;
    retry: string;
  };
  result: {
    photo: string;
    photoMissing: string;
    eyebrow: string;
    criteria: string;
    cards: string;
    facts: string;
    verified: string;
    claimed: string;
    from: string;
    profile: string;
    rank: string;
    outcome: Record<"found" | "no_category_in_city" | "all_filtered_out", string>;
    emptyHint: string;
    flags: {
      synthetic: string;
      priceImputed: string;
      cityImputed: string;
    };
  };
  bundle: {
    eyebrow: string;
    title: string;
    required: string;
    recommended: string;
    found: string;
    coverage: string;
    missing: string;
    alternatives: string;
    totalBudget: string;
    budget: string;
    empty: string;
  };
  labels: Pick<MatchMessages, "categories" | "cities" | "eventFormats" | "languages">;
  quickDates: readonly { label: string; value: string }[];
  quickBudgets: readonly { label: string; value: string }[];
}

const messages = {
  ru: {
    pageTitle: "ToiMatch — ассистент подбора",
    pageDescription:
      "Диалоговый помощник собирает параметры события и запускает проверяемый подбор подрядчиков.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — каталог подрядчиков",
    navigationAria: "Основная навигация",
    nav: { catalog: "Каталог", match: "AI-подбор", chat: "AI-чат", manager: "Для жюри" },
    localeLabel: "Язык интерфейса",
    skip: "Перейти к диалогу",
    hero: {
      eyebrow: "AI-ассистент",
      title: "Опишите событие.",
      accent: "Остальное соберём вместе.",
      description:
        "Ассистент задаст пару вопросов и покажет до трёх подрядчиков — с фактами из каталога.",
      badge: "Ответ с фактами из каталога",
    },
    modes: {
      label: "Режим ассистента",
      search: {
        label: "Один подрядчик",
        description: "Диалог и до трёх вариантов в одной категории",
      },
      bundle: {
        label: "Пакет события",
        description: "Обязательные и рекомендуемые категории в одном бюджете",
      },
    },
    session: {
      eyebrow: "Диалог",
      title: "Состояние диалога",
      id: "Сессия",
      status: {
        starting: "Подключаемся",
        ready: "Ассистент готов",
        streaming: "Печатает ответ",
        error: "Не удалось ответить",
      },
      statusDescription: {
        starting: "Готовим диалог",
        ready: "Можно писать",
        streaming: "Ответ появляется прямо сейчас",
        error: "Попробуйте ещё раз",
      },
    },
    tools: {
      search_contractors: "Проверяем каталог и подбираем подрядчиков",
      build_event_bundle: "Собираем пакет по нескольким категориям",
    },
    starterPrompts: {
      search: [
        "Ведущий, Алматы, корпоратив 2026-10-16, бюджет 1 000 000 ₸",
        "Флорист, Алматы, свадьба 2026-10-15, бюджет 300 000 ₸",
      ],
      bundle: [
        "Соберите пакет на свадьбу в Алматы 2026-10-16, бюджет 5 000 000 ₸",
        "Нужен пакет на корпоратив в Алматы 2026-10-23, бюджет 4 000 000 ₸",
      ],
    },
    starterLabels: {
      search: [
        "Ведущий · Алматы · корпоратив 16 октября · 1 млн ₸",
        "Флорист · Алматы · свадьба 15 октября · 300 000 ₸",
      ],
      bundle: [
        "Пакет на свадьбу · Алматы · 16 октября · 5 млн ₸",
        "Пакет на корпоратив · Алматы · 23 октября · 4 млн ₸",
      ],
    },
    fields: {
      category: {
        label: "Категория",
        prompt: "Кого ищем? Напишите категорию или выберите один из вариантов.",
        placeholder: "Например, ведущий или фотограф",
      },
      city: {
        label: "Город",
        prompt: "В каком городе пройдёт событие?",
        placeholder: "Например, Алматы",
      },
      date: {
        label: "Дата",
        prompt: "На какую дату нужен подрядчик? Можно написать 16.10 или 2026-10-16.",
        placeholder: "ДД.ММ или ГГГГ-ММ-ДД",
      },
      eventType: {
        label: "Формат",
        prompt: "Какой формат у события?",
        placeholder: "Например, корпоратив",
      },
      budgetKzt: {
        label: "Бюджет",
        prompt: "Какой бюджет заложен на подрядчика?",
        placeholder: "Например, 1 000 000 ₸",
      },
      language: {
        label: "Язык",
        prompt: "Нужен определённый язык подрядчика? Этот шаг можно пропустить.",
        placeholder: "Русский, казахский, английский или любой",
      },
    },
    progress: {
      eyebrow: "Параметры запроса",
      title: "Что уже понятно",
      complete: "Заполнено",
      pending: "Ждёт ответа",
      edit: "Изменить",
      optional: "необязательно",
    },
    assistant: {
      name: "Ассистент ToiMatch",
      label: "Помощник",
      greeting:
        "Здравствуйте! Я помогу сформировать точный запрос и найти подходящих подрядчиков.",
      transparency:
        "Я не фантазирую: собираю условия и подбираю только по фактам из каталога.",
      understood: "Принято. Зафиксировал параметры и двигаюсь дальше.",
      changed: "Параметр обновлён. Пересчитываю подбор по новым условиям.",
      searching: "Запрос готов. Проверяю город, дату, формат, бюджет и язык…",
      resultReady: "Готово. Ниже — подходящие подрядчики и факты по каждому.",
      attachmentReady: "Проверил запрос. Результат и причины — ниже.",
      noRecognition: "Не смог распознать ответ. Используйте подсказку или один из готовых вариантов.",
      invalidDate: "Не удалось распознать дату. Напишите её как 16.10 или 2026-10-16.",
      invalidBudget: "Не удалось распознать бюджет. Например: 300 000 ₸ или 1 млн.",
      restarted: "Начнём заново. Сначала определим, какой подрядчик нужен.",
      error: "Подбор не завершился. Попробуйте ещё раз через минуту.",
    },
    composer: {
      label: "Ваш ответ",
      send: "Отправить",
      sending: "Проверяем…",
      hint: "Можно написать несколько параметров сразу — например: «Ведущий, Алматы, корпоратив 16.10, бюджет 1 млн».",
      placeholder: "Опишите событие или ответьте ассистенту",
    },
    actions: {
      anyLanguage: "Любой язык",
      restart: "Начать заново",
      change: "Изменить условия",
      retry: "Повторить подбор",
    },
    result: {
      photo: "Фото: ИИ-иллюстрация", photoMissing: "Фото недоступно",
      eyebrow: "Результат подбора",
      criteria: "На что смотреть",
      cards: "Подходящие подрядчики",
      facts: "Факты выбора",
      verified: "проверено",
      claimed: "со слов подрядчика",
      from: "от",
      profile: "Открыть профиль",
      rank: "Место",
      outcome: {
        found: "Варианты найдены",
        no_category_in_city: "Категории нет в городе",
        all_filtered_out: "Все кандидаты отсеяны",
      },
      emptyHint: "Измените один из параметров — помощник запустит проверку снова.",
      flags: {
        synthetic: "синтетический профиль",
        priceImputed: "цена дополнена",
        cityImputed: "город дополнен",
      },
    },
    bundle: {
      eyebrow: "Пакет мероприятия",
      title: "Подрядчики по категориям",
      required: "Обязательные категории",
      recommended: "Рекомендуемые категории",
      found: "Есть варианты",
      coverage: "категорий с вариантами",
      missing: "Не удалось подобрать:",
      alternatives: "Другие варианты",
      totalBudget: "Ваш бюджет",
      budget: "Лимит категории",
      empty: "В этой категории подходящих вариантов нет",
    },
    labels: {
      categories: MATCH_MESSAGES.ru.categories,
      cities: MATCH_MESSAGES.ru.cities,
      eventFormats: MATCH_MESSAGES.ru.eventFormats,
      languages: MATCH_MESSAGES.ru.languages,
    },
    quickDates: [
      { label: "16 октября", value: "2026-10-16" },
      { label: "23 октября", value: "2026-10-23" },
      { label: "14 ноября", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "300 000 ₸", value: "300000" },
      { label: "1 000 000 ₸", value: "1000000" },
      { label: "1 500 000 ₸", value: "1500000" },
    ],
  },
  kk: {
    pageTitle: "ToiMatch — таңдау көмекшісі",
    pageDescription:
      "Диалог көмекшісі іс-шара параметрлерін жинап, мердігерлерді тексерілетін іріктеуді іске қосады.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — мердігерлер каталогы",
    navigationAria: "Негізгі навигация",
    nav: { catalog: "Каталог", match: "AI-таңдау", chat: "AI-чат", manager: "Қазыларға" },
    localeLabel: "Интерфейс тілі",
    skip: "Диалогқа өту",
    hero: {
      eyebrow: "AI-көмекші",
      title: "Іс-шараны сипаттаңыз.",
      accent: "Қалғанын бірге жинаймыз.",
      description:
        "Көмекші бірнеше сұрақ қойып, үшке дейін мердігер көрсетеді — каталог деректерімен.",
      badge: "Жауап каталог деректерімен",
    },
    modes: {
      label: "Көмекші режимі",
      search: {
        label: "Бір мердігер",
        description: "Диалог және бір санаттағы үш нұсқаға дейін",
      },
      bundle: {
        label: "Іс-шара пакеті",
        description: "Бір бюджеттегі міндетті және ұсынылатын санаттар",
      },
    },
    session: {
      eyebrow: "Диалог",
      title: "Диалог күйі",
      id: "Сессия",
      status: {
        starting: "Қосылуда",
        ready: "Көмекші дайын",
        streaming: "Жауап жазып жатыр",
        error: "Жауап беру мүмкін болмады",
      },
      statusDescription: {
        starting: "Диалогты дайындап жатырмыз",
        ready: "Жаза беріңіз",
        streaming: "Жауап дәл қазір пайда болуда",
        error: "Қайта көріңіз",
      },
    },
    tools: {
      search_contractors: "Каталогты тексеріп, мердігерлерді іріктеп жатырмыз",
      build_event_bundle: "Бірнеше санат бойынша пакет жиналуда",
    },
    starterPrompts: {
      search: [
        "Жүргізуші, Алматы, корпоратив 2026-10-16, бюджет 1 000 000 ₸",
        "Флорист, Алматы, үйлену тойы 2026-10-15, бюджет 300 000 ₸",
      ],
      bundle: [
        "Алматыда 2026-10-16 өтетін үйлену тойына 5 000 000 ₸ пакет жинаңыз",
        "Алматыда 2026-10-23 өтетін корпоративке 4 000 000 ₸ пакет керек",
      ],
    },
    starterLabels: {
      search: [
        "Жүргізуші · Алматы · корпоратив 16 қазан · 1 млн ₸",
        "Флорист · Алматы · үйлену тойы 15 қазан · 300 000 ₸",
      ],
      bundle: [
        "Үйлену тойына пакет · Алматы · 16 қазан · 5 млн ₸",
        "Корпоративке пакет · Алматы · 23 қазан · 4 млн ₸",
      ],
    },
    fields: {
      category: {
        label: "Санат",
        prompt: "Кімді іздейміз? Санатты жазыңыз немесе нұсқаны таңдаңыз.",
        placeholder: "Мысалы, жүргізуші немесе фотограф",
      },
      city: {
        label: "Қала",
        prompt: "Іс-шара қай қалада өтеді?",
        placeholder: "Мысалы, Алматы",
      },
      date: {
        label: "Күні",
        prompt: "Мердігер қай күнге қажет? 16.10 немесе 2026-10-16 деп жаза аласыз.",
        placeholder: "КК.АА немесе ЖЖЖЖ-АА-КК",
      },
      eventType: {
        label: "Формат",
        prompt: "Іс-шараның форматы қандай?",
        placeholder: "Мысалы, корпоратив",
      },
      budgetKzt: {
        label: "Бюджет",
        prompt: "Мердігерге қандай бюджет қарастырылған?",
        placeholder: "Мысалы, 1 000 000 ₸",
      },
      language: {
        label: "Тіл",
        prompt: "Мердігердің нақты тілі қажет пе? Бұл қадамды өткізуге болады.",
        placeholder: "Қазақша, орысша, ағылшынша немесе кез келген",
      },
    },
    progress: {
      eyebrow: "Сұраныс параметрлері",
      title: "Не белгілі",
      complete: "Толтырылды",
      pending: "Жауап күтуде",
      edit: "Өзгерту",
      optional: "міндетті емес",
    },
    assistant: {
      name: "ToiMatch көмекшісі",
      label: "Көмекші",
      greeting:
        "Сәлеметсіз бе! Нақты сұраныс құрып, сәйкес мердігерлерді табуға көмектесемін.",
      transparency:
        "Мен ойдан шығармаймын: шарттарды жинап, тек каталог деректері бойынша іріктеймін.",
      understood: "Қабылданды. Параметрлерді белгілеп, келесі қадамға өтемін.",
      changed: "Параметр жаңартылды. Жаңа шарттар бойынша таңдауды қайта есептеймін.",
      searching: "Сұраныс дайын. Қаланы, күнді, форматты, бюджетті және тілді тексеремін…",
      resultReady: "Дайын. Төменде сәйкес мердігерлер және әрқайсысы бойынша деректер.",
      attachmentReady: "Сұранысты тексердім. Нәтиже мен себептері төменде.",
      noRecognition: "Жауапты тани алмадым. Кеңесті немесе дайын нұсқаны пайдаланыңыз.",
      invalidDate: "Күнді тани алмадым. 16.10 немесе 2026-10-16 түрінде жазыңыз.",
      invalidBudget: "Бюджетті тани алмадым. Мысалы: 300 000 ₸ немесе 1 млн.",
      restarted: "Қайта бастайық. Алдымен қандай мердігер қажет екенін анықтаймыз.",
      error: "Іріктеу аяқталмады. Бір минуттан кейін қайта көріңіз.",
    },
    composer: {
      label: "Сіздің жауабыңыз",
      send: "Жіберу",
      sending: "Тексерудеміз…",
      hint: "Бірнеше параметрді бірге жаза аласыз: «Жүргізуші, Алматы, корпоратив 16.10, бюджет 1 млн».",
      placeholder: "Іс-шараны сипаттаңыз немесе көмекшіге жауап беріңіз",
    },
    actions: {
      anyLanguage: "Кез келген тіл",
      restart: "Қайта бастау",
      change: "Шарттарды өзгерту",
      retry: "Қайта таңдау",
    },
    result: {
      photo: "Фото: ЖИ иллюстрациясы", photoMissing: "Фото қолжетімсіз",
      eyebrow: "Іріктеу нәтижесі",
      criteria: "Неге назар аудару керек",
      cards: "Сәйкес мердігерлер",
      facts: "Таңдау деректері",
      verified: "тексерілді",
      claimed: "мердігердің айтуынша",
      from: "бастап",
      profile: "Профильді ашу",
      rank: "Орын",
      outcome: {
        found: "Нұсқалар табылды",
        no_category_in_city: "Қалада бұл санат жоқ",
        all_filtered_out: "Барлық үміткер сүзілді",
      },
      emptyHint: "Параметрлердің бірін өзгертіңіз — көмекші тексеруді қайта іске қосады.",
      flags: {
        synthetic: "синтетикалық профиль",
        priceImputed: "баға толықтырылған",
        cityImputed: "қала толықтырылған",
      },
    },
    bundle: {
      eyebrow: "Іс-шара пакеті",
      title: "Санаттар бойынша мердігерлер",
      required: "Міндетті санаттар",
      recommended: "Ұсынылатын санаттар",
      found: "Нұсқалар бар",
      coverage: "санатта нұсқалар бар",
      missing: "Іріктелмеді:",
      alternatives: "Басқа нұсқалар",
      totalBudget: "Жалпы бюджет",
      budget: "Санат лимиті",
      empty: "Бұл санатта сәйкес нұсқа жоқ",
    },
    labels: {
      categories: MATCH_MESSAGES.kk.categories,
      cities: MATCH_MESSAGES.kk.cities,
      eventFormats: MATCH_MESSAGES.kk.eventFormats,
      languages: MATCH_MESSAGES.kk.languages,
    },
    quickDates: [
      { label: "16 қазан", value: "2026-10-16" },
      { label: "23 қазан", value: "2026-10-23" },
      { label: "14 қараша", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "300 000 ₸", value: "300000" },
      { label: "1 000 000 ₸", value: "1000000" },
      { label: "1 500 000 ₸", value: "1500000" },
    ],
  },
  en: {
    pageTitle: "ToiMatch — matching assistant",
    pageDescription:
      "A conversational assistant collects event details and runs a verifiable contractor match.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — contractor catalog",
    navigationAria: "Primary navigation",
    nav: { catalog: "Catalog", match: "AI match", chat: "AI chat", manager: "For judges" },
    localeLabel: "Interface language",
    skip: "Skip to conversation",
    hero: {
      eyebrow: "AI assistant",
      title: "Describe your event.",
      accent: "We will shape the rest together.",
      description:
        "The assistant asks a couple of questions and shows up to three contractors — backed by catalog facts.",
      badge: "Answers backed by catalog facts",
    },
    modes: {
      label: "Assistant mode",
      search: {
        label: "Single contractor",
        description: "A conversation and up to three options in one category",
      },
      bundle: {
        label: "Event bundle",
        description: "Required and recommended categories within one budget",
      },
    },
    session: {
      eyebrow: "Conversation",
      title: "Conversation status",
      id: "Session",
      status: {
        starting: "Connecting",
        ready: "Assistant ready",
        streaming: "Typing a reply",
        error: "Could not reply",
      },
      statusDescription: {
        starting: "Preparing the conversation",
        ready: "Go ahead and type",
        streaming: "The reply is appearing now",
        error: "Please try again",
      },
    },
    tools: {
      search_contractors: "Checking the catalog and picking contractors",
      build_event_bundle: "Building a bundle across several categories",
    },
    starterPrompts: {
      search: [
        "Host, Almaty, corporate event 2026-10-16, budget 1,000,000 ₸",
        "Florist, Almaty, wedding 2026-10-15, budget 300,000 ₸",
      ],
      bundle: [
        "Build a wedding bundle in Almaty for 2026-10-16 with a 5,000,000 ₸ budget",
        "I need a corporate bundle in Almaty for 2026-10-23 with a 4,000,000 ₸ budget",
      ],
    },
    starterLabels: {
      search: [
        "Host · Almaty · corporate event on 16 October · ₸1M",
        "Florist · Almaty · wedding on 15 October · ₸300,000",
      ],
      bundle: [
        "Wedding bundle · Almaty · 16 October · ₸5M",
        "Corporate bundle · Almaty · 23 October · ₸4M",
      ],
    },
    fields: {
      category: {
        label: "Category",
        prompt: "Who are you looking for? Type a category or choose an option.",
        placeholder: "For example, host or photographer",
      },
      city: {
        label: "City",
        prompt: "Which city is the event in?",
        placeholder: "For example, Almaty",
      },
      date: {
        label: "Date",
        prompt: "What date do you need the contractor? You can type 16.10 or 2026-10-16.",
        placeholder: "DD.MM or YYYY-MM-DD",
      },
      eventType: {
        label: "Format",
        prompt: "What type of event is it?",
        placeholder: "For example, corporate event",
      },
      budgetKzt: {
        label: "Budget",
        prompt: "What is the contractor budget?",
        placeholder: "For example, 1,000,000 ₸",
      },
      language: {
        label: "Language",
        prompt: "Do you need a specific contractor language? You may skip this step.",
        placeholder: "Russian, Kazakh, English or any",
      },
    },
    progress: {
      eyebrow: "Request details",
      title: "What we know",
      complete: "Completed",
      pending: "Waiting for answer",
      edit: "Edit",
      optional: "optional",
    },
    assistant: {
      name: "ToiMatch assistant",
      label: "Assistant",
      greeting:
        "Hello! I will help shape a precise request and find suitable contractors.",
      transparency:
        "I do not make things up: I collect your conditions and match only on catalog facts.",
      understood: "Got it. I have saved those details and will move to the next step.",
      changed: "That detail is updated. I will recalculate the match using the new conditions.",
      searching: "The request is ready. Checking city, date, format, budget and language…",
      resultReady: "Done. Below are suitable contractors and the facts behind each one.",
      attachmentReady: "I checked your request. The result and reasons are below.",
      noRecognition: "I could not recognise that answer. Use the hint or choose one of the options.",
      invalidDate: "I could not recognise the date. Type it as 16.10 or 2026-10-16.",
      invalidBudget: "I could not recognise the budget. For example: 300,000 ₸ or 1 million.",
      restarted: "Let us start again. First, we will identify the contractor category.",
      error: "Matching did not finish. Please try again in a minute.",
    },
    composer: {
      label: "Your answer",
      send: "Send",
      sending: "Checking…",
      hint: "You can include several details at once, such as “Host, Almaty, corporate event on 16.10, budget 1 million”.",
      placeholder: "Describe the event or answer the assistant",
    },
    actions: {
      anyLanguage: "Any language",
      restart: "Start over",
      change: "Change details",
      retry: "Retry matching",
    },
    result: {
      photo: "Photo: AI illustration", photoMissing: "Photo unavailable",
      eyebrow: "Match result",
      criteria: "What to look for",
      cards: "Suitable contractors",
      facts: "Selection evidence",
      verified: "verified",
      claimed: "according to contractor",
      from: "from",
      profile: "Open profile",
      rank: "Rank",
      outcome: {
        found: "Options found",
        no_category_in_city: "Category unavailable in this city",
        all_filtered_out: "All candidates were filtered out",
      },
      emptyHint: "Change one detail and the assistant will run the check again.",
      flags: {
        synthetic: "synthetic profile",
        priceImputed: "price imputed",
        cityImputed: "city imputed",
      },
    },
    bundle: {
      eyebrow: "Event bundle",
      title: "Contractors by category",
      required: "Required categories",
      recommended: "Recommended categories",
      found: "Options found",
      coverage: "categories with options",
      missing: "No match for:",
      alternatives: "Other options",
      totalBudget: "Total budget",
      budget: "Category limit",
      empty: "No suitable option in this category",
    },
    labels: {
      categories: MATCH_MESSAGES.en.categories,
      cities: MATCH_MESSAGES.en.cities,
      eventFormats: MATCH_MESSAGES.en.eventFormats,
      languages: MATCH_MESSAGES.en.languages,
    },
    quickDates: [
      { label: "16 October", value: "2026-10-16" },
      { label: "23 October", value: "2026-10-23" },
      { label: "14 November", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "₸300,000", value: "300000" },
      { label: "₸1,000,000", value: "1000000" },
      { label: "₸1,500,000", value: "1500000" },
    ],
  },
} satisfies Record<Locale, ChatMessages>;

export const CHAT_MESSAGES: Record<Locale, ChatMessages> = messages;
