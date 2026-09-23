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
  };
  actions: {
    anyLanguage: string;
    restart: string;
    change: string;
    retry: string;
  };
  result: {
    eyebrow: string;
    criteria: string;
    cards: string;
    facts: string;
    verified: string;
    claimed: string;
    from: string;
    outcome: Record<"found" | "no_category_in_city" | "all_filtered_out", string>;
    emptyHint: string;
    flags: {
      synthetic: string;
      priceImputed: string;
      cityImputed: string;
    };
  };
  labels: Pick<MatchMessages, "categories" | "cities" | "eventFormats" | "languages">;
  quickDates: readonly { label: string; value: string }[];
  quickBudgets: readonly { label: string; value: string }[];
}

const messages = {
  ru: {
    pageTitle: "Тройка — ассистент подбора",
    pageDescription:
      "Диалоговый помощник собирает параметры события и запускает проверяемый подбор подрядчиков.",
    brand: "Тройка",
    brandAria: "Тройка — каталог подрядчиков",
    navigationAria: "Основная навигация",
    nav: { catalog: "Каталог", match: "AI-подбор", chat: "AI-чат", manager: "Для жюри" },
    localeLabel: "Язык интерфейса",
    skip: "Перейти к диалогу",
    hero: {
      eyebrow: "Диалоговый подбор",
      title: "Опишите событие.",
      accent: "Остальное соберём вместе.",
      description:
        "Помощник задаст короткие вопросы, проверит ваш запрос по каталогу и покажет до трёх вариантов с доказательствами.",
      badge: "Работает на matching engine",
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
      name: "Ассистент Тройки",
      label: "Помощник",
      greeting:
        "Здравствуйте! Я помогу сформировать точный запрос и найти подходящих подрядчиков.",
      transparency:
        "Я не импровизирую как свободный чат-бот: собираю факты и передаю их в детерминированный matching engine.",
      understood: "Принято. Зафиксировал параметры и двигаюсь дальше.",
      changed: "Параметр обновлён. Пересчитываю подбор по новым условиям.",
      searching: "Запрос готов. Проверяю город, дату, формат, бюджет и язык…",
      resultReady: "Проверка завершена. Ниже — ответ matching engine и факты по кандидатам.",
      noRecognition: "Не смог распознать ответ. Используйте подсказку или один из готовых вариантов.",
      invalidDate: "Не удалось распознать дату. Напишите её как 16.10 или 2026-10-16.",
      invalidBudget: "Не удалось распознать бюджет. Например: 300 000 ₸ или 1 млн.",
      restarted: "Начнём заново. Сначала определим, какой подрядчик нужен.",
      error: "Подбор сейчас не завершился. Проверьте, запущен ли backend, и повторите попытку.",
    },
    composer: {
      label: "Ваш ответ",
      send: "Отправить",
      sending: "Проверяем…",
      hint: "Можно написать несколько параметров сразу — например: «Ведущий, Алматы, корпоратив 16.10, бюджет 1 млн».",
    },
    actions: {
      anyLanguage: "Любой язык",
      restart: "Начать заново",
      change: "Изменить условия",
      retry: "Повторить подбор",
    },
    result: {
      eyebrow: "Ответ matching engine",
      criteria: "На что смотреть",
      cards: "Подходящие подрядчики",
      facts: "Факты выбора",
      verified: "проверено",
      claimed: "со слов подрядчика",
      from: "от",
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
    pageTitle: "Тройка — таңдау көмекшісі",
    pageDescription:
      "Диалог көмекшісі іс-шара параметрлерін жинап, мердігерлерді тексерілетін іріктеуді іске қосады.",
    brand: "Тройка",
    brandAria: "Тройка — мердігерлер каталогы",
    navigationAria: "Негізгі навигация",
    nav: { catalog: "Каталог", match: "AI-таңдау", chat: "AI-чат", manager: "Қазыларға" },
    localeLabel: "Интерфейс тілі",
    skip: "Диалогқа өту",
    hero: {
      eyebrow: "Диалог арқылы таңдау",
      title: "Іс-шараны сипаттаңыз.",
      accent: "Қалғанын бірге жинаймыз.",
      description:
        "Көмекші қысқа сұрақтар қояды, сұранысты каталог бойынша тексереді және дәлелдері бар үш нұсқаға дейін көрсетеді.",
      badge: "Matching engine арқылы жұмыс істейді",
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
      name: "Тройка көмекшісі",
      label: "Көмекші",
      greeting:
        "Сәлеметсіз бе! Нақты сұраныс құрып, сәйкес мердігерлерді табуға көмектесемін.",
      transparency:
        "Мен еркін чат-бот сияқты болжам жасамаймын: деректерді жинап, оларды детерминделген matching engine-ге жіберемін.",
      understood: "Қабылданды. Параметрлерді белгілеп, келесі қадамға өтемін.",
      changed: "Параметр жаңартылды. Жаңа шарттар бойынша таңдауды қайта есептеймін.",
      searching: "Сұраныс дайын. Қаланы, күнді, форматты, бюджетті және тілді тексеремін…",
      resultReady: "Тексеру аяқталды. Төменде matching engine жауабы мен үміткер деректері берілген.",
      noRecognition: "Жауапты тани алмадым. Кеңесті немесе дайын нұсқаны пайдаланыңыз.",
      invalidDate: "Күнді тани алмадым. 16.10 немесе 2026-10-16 түрінде жазыңыз.",
      invalidBudget: "Бюджетті тани алмадым. Мысалы: 300 000 ₸ немесе 1 млн.",
      restarted: "Қайта бастайық. Алдымен қандай мердігер қажет екенін анықтаймыз.",
      error: "Таңдау аяқталмады. Backend іске қосылғанын тексеріп, қайта көріңіз.",
    },
    composer: {
      label: "Сіздің жауабыңыз",
      send: "Жіберу",
      sending: "Тексерудеміз…",
      hint: "Бірнеше параметрді бірге жаза аласыз: «Жүргізуші, Алматы, корпоратив 16.10, бюджет 1 млн».",
    },
    actions: {
      anyLanguage: "Кез келген тіл",
      restart: "Қайта бастау",
      change: "Шарттарды өзгерту",
      retry: "Қайта таңдау",
    },
    result: {
      eyebrow: "Matching engine жауабы",
      criteria: "Неге назар аудару керек",
      cards: "Сәйкес мердігерлер",
      facts: "Таңдау деректері",
      verified: "тексерілді",
      claimed: "мердігердің айтуынша",
      from: "бастап",
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
    pageTitle: "Troika — matching assistant",
    pageDescription:
      "A conversational assistant collects event details and runs a verifiable contractor match.",
    brand: "Troika",
    brandAria: "Troika — contractor catalog",
    navigationAria: "Primary navigation",
    nav: { catalog: "Catalog", match: "AI match", chat: "AI chat", manager: "For judges" },
    localeLabel: "Interface language",
    skip: "Skip to conversation",
    hero: {
      eyebrow: "Conversational matching",
      title: "Describe your event.",
      accent: "We will shape the rest together.",
      description:
        "The assistant asks short questions, checks your request against the catalog and shows up to three evidence-backed options.",
      badge: "Powered by the matching engine",
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
      name: "Troika assistant",
      label: "Assistant",
      greeting:
        "Hello! I will help shape a precise request and find suitable contractors.",
      transparency:
        "I do not improvise like an open-ended chatbot: I collect facts and pass them to a deterministic matching engine.",
      understood: "Got it. I have saved those details and will move to the next step.",
      changed: "That detail is updated. I will recalculate the match using the new conditions.",
      searching: "The request is ready. Checking city, date, format, budget and language…",
      resultReady: "The check is complete. Below is the matching engine response and candidate evidence.",
      noRecognition: "I could not recognise that answer. Use the hint or choose one of the options.",
      invalidDate: "I could not recognise the date. Type it as 16.10 or 2026-10-16.",
      invalidBudget: "I could not recognise the budget. For example: 300,000 ₸ or 1 million.",
      restarted: "Let us start again. First, we will identify the contractor category.",
      error: "Matching did not finish. Check that the backend is running and try again.",
    },
    composer: {
      label: "Your answer",
      send: "Send",
      sending: "Checking…",
      hint: "You can include several details at once, such as “Host, Almaty, corporate event on 16.10, budget 1 million”.",
    },
    actions: {
      anyLanguage: "Any language",
      restart: "Start over",
      change: "Change details",
      retry: "Retry matching",
    },
    result: {
      eyebrow: "Matching engine response",
      criteria: "What to look for",
      cards: "Suitable contractors",
      facts: "Selection evidence",
      verified: "verified",
      claimed: "according to contractor",
      from: "from",
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
