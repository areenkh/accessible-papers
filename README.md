# Paperlight

Paperlight is a browser-based prototype for reviewing accessibility issues in a sample research paper.

## Open the prototype

1. Download the entire `accessible-papers` folder. If it arrives as a ZIP, unzip it first.
2. Open the folder and double-click `index.html`.
3. In your browser, select **Create draft reading version** to start reviewing the sample.

Keep `index.html`, `app.js`, `styles.css`, and `sample-pdf.js` together. The prototype runs offline and requires no installation.

## Run from Terminal

If you have Python 3, you can also open Terminal in the downloaded folder and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser. Press **Ctrl+C** in Terminal to stop the server.

## Start over

Paperlight keeps review decisions in the current browser when local storage is available. Choose **Restart sample** to clear saved decisions and review the same example again.
