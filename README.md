# Book of Hours Companion

An unofficial companion tool for [Book of Hours](https://store.steampowered.com/app/1028310/BOOK_OF_HOURS/), the excellent library management / occult RPG by [Weather Factory](https://weatherfactory.biz). Use it to track your discoveries, skills, and progress as you explore Hush House.

## About

I built this to help me keep track of the various things in the game after spending many hours playing. The game gives you a lot of information and this tool is designed to make it easier to keep track of what's going on.

This tool is not intended to be an exhaustive reference for everything in the game, nor to give any spoilers. If you want an exhaustive reference, try the [Book of Hours Wiki](https://book-of-hours.fandom.com/wiki/Book_of_Hours_Wiki)

> **Note:** This tool is probably best saved for when you already know you need it. If you're just starting out, a simple notepad will do fine. Come back once the complexity has grown on you.

All data is stored locally in your browser — nothing is sent anywhere.

## How to use

The easiest way is to use the hosted version on GitHub Pages:

> **https://lmbell89.github.io/book-of-hours-catalogue**

No installation needed — just open it in a browser and start adding things.

## Running locally

If you'd prefer to run it yourself:

```bash
git clone https://github.com/[placeholder]/book-of-hours.git
cd book-of-hours
npm install
npm run dev
```

The game data under `src/data/` is already included. If you want to regenerate it from your own Steam installation (macOS):

```bash
npm run extract
```

## Contributing

Feature requests, pull requests, and contributions of all kinds are welcome.

## Disclaimer

This tool is free and open source. The game is not — please buy it, it's well worth it.

This is an unofficial fan project, not affiliated with or endorsed by Weather Factory Ltd. All game content, names, and data referenced here belong to Weather Factory. No proprietary assets are included.

See [LICENSE](LICENSE) for full details.
