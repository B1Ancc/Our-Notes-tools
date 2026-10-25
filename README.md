# Our Notes tools

Small calculators for **Our Notes**, made by a fan. Unofficial, and not affiliated with the game or its publisher.

| Tool | What it does |
| --- | --- |
| [Pull Income](pull-income/index.html) | Pulls per day, week and month for F2P and each pass (Lite, Standard, Premium), with optional Premium Mission Pass and Season Mission Pass. Also how long a pull goal takes. |
| [Live Points](live-points/index.html) | Event points, badges and CP from Free Live and Challenge Live. How many songs, flames or CP a goal needs, a plan that mixes both lives, and an event shop planner. |

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
npm start        # http://localhost:8000
```

## Publish on GitHub Pages

1. Push the repo to GitHub.
2. Settings, Pages, Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The tools are at `https://<user>.github.io/<repo>/`.

## Tests

```sh
npm test         # Node 18 or newer, nothing to install
```

The tests cover the reward tables, income totals, the plan solver (checked against a brute force search), and loading old saved settings.

## Structure

```
index.html            landing page
assets/               base.css (shared layout), ui.js (shared helpers)
pull-income/          calc.js (numbers), state.js (saved settings), app.js (page), style.css
live-points/          data.js (game data), calc.js, state.js, app.js, style.css
tests/                node:test files
```

`calc.js`, `state.js` and `data.js` have no DOM code, so the same files run in the browser and in the tests.

## Feedback button

Create a Google Form, copy its share link, and paste it into `FEEDBACK_URL` in `assets/feedback.js`. Until then the button stays hidden. Answers show up in Google Forms, and in Sheets if you link one.

## Updating when the game changes

- **Live Points rewards, shop items and costs:** edit `live-points/data.js`.
- **Pull income amounts and pass values:** edit the `BASE` and `TIERS` tables at the top of `pull-income/calc.js`.
- Run `npm test` afterwards. A test that fails on a number you changed on purpose just needs its expected value updated.

## Saved settings

Each tool saves its settings in your browser's localStorage (`ournotes.pull-income.v1`, `ournotes.live-points.v1`). Nothing is sent anywhere. Saves from earlier versions are picked up automatically.

## License

None yet. Add a `LICENSE` file before others reuse the code.
