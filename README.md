# SilkFlow AI — MVP

Рабочий адаптивный MVP логистической платформы **SilkFlow AI** для демонстрации на хакатоне.

## Что есть в MVP

- Клиент
- Отправитель
- Склад / Карго
- Водитель
- Получатель
- Создание и отслеживание грузов
- Smart Split
- P2P последняя миля
- AI-Таможенник в demo-режиме
- QR-сценарий получения
- Адаптивный интерфейс для телефона, планшета и компьютера

---

# Как загрузить на GitHub Pages

## 1. Структура репозитория

Очень важно: файлы сайта должны лежать **прямо в корне репозитория**.

Правильно:

```text
silkflowai/
├── index.html
├── config.js
├── config.example.js
├── assets/
│   ├── app.js
│   ├── db.js
│   └── styles.css
├── supabase/
│   └── schema.sql
└── README.md
```

Не загружайте папку `SilkFlow_AI_Full_MVP_Responsive` целиком как вложенную папку.

То есть GitHub при открытии репозитория должен сразу показывать файл:

```text
index.html
```

---

## 2. Загрузите файлы в GitHub

Откройте свой репозиторий, например:

```text
silkflowai
```

Нажмите:

**Add file → Upload files**

Загрузите содержимое папки проекта:

- `index.html`
- `config.js`
- `config.example.js`
- папку `assets`
- папку `supabase`
- этот `README.md`

После этого нажмите:

**Commit changes**

---

## 3. Включите GitHub Pages

В репозитории откройте:

**Settings → Pages**

В разделе **Build and deployment**:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Нажмите **Save**.

Через несколько минут сайт будет доступен примерно по адресу:

```text
https://USERNAME.github.io/silkflowai/
```

Например:

```text
https://akbarchick06.github.io/silkflowai/
```

---

# ВАЖНО: если вместо сайта показывается строка config.js

Если при открытии сайта вы видите примерно такой текст:

```js
window.SILKFLOW_CONFIG = {
  supabaseUrl: "...",
  supabaseAnonKey: "..."
};
```

значит в GitHub файл `index.html` был загружен неправильно или его содержимое случайно заменили содержимым `config.js`.

## Как исправить

1. Откройте репозиторий GitHub.
2. Найдите `index.html`.
3. Откройте его.
4. Начало правильного файла должно выглядеть так:

```html
<!doctype html>
<html lang="ru">
<head>
```

Если вместо этого там написано:

```js
window.SILKFLOW_CONFIG
```

удалите неправильный `index.html` и заново загрузите настоящий `index.html` из проекта.

`config.js` должен оставаться отдельным файлом с именем:

```text
config.js
```

---

# Supabase

Сайт может работать без Supabase в локальном demo-режиме.

В `config.js` можно оставить:

```js
window.SILKFLOW_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
```

Для общей базы на разных устройствах позже укажите данные Supabase:

```js
window.SILKFLOW_CONFIG = {
  supabaseUrl: "https://ВАШ_ПРОЕКТ.supabase.co",
  supabaseAnonKey: "ВАШ_ANON_KEY"
};
```

Не используйте `service_role` key на frontend.

---

# Проверка перед презентацией

Откройте сайт:

- на компьютере;
- на Android;
- на iPhone;
- в режиме инкогнито.

Проверьте переключение ролей:

```text
Клиент → Отправитель → Склад / Карго → Водитель → Получатель
```

Если GitHub Pages только что включён или обновлён, изменения могут появиться не мгновенно. Подождите несколько минут и обновите страницу.

---

## SilkFlow AI

**Команда:**

- Ашимов Бектур — проект-координатор
- Орозбеков Нурислам — спикер
- Кобылжонов Акбар — разработчик
