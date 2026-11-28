'use strict';

const catalog = {
  figure: {
    title: 'Figure description', location: 'Figure 2, page 3',
    issue: 'The source figure has a caption but no description of its comparisons.',
    impact: 'A reader who cannot see the bars may miss which strategy cools more and where that pattern reverses.',
    resolution: 'An author-approved description is included in the reading version.',
    guidance: 'Name the two strategies, state where each cools more, and use values where they help explain the comparison.'
  },
  sections: {
    title: 'Section structure', location: 'Results, page 3',
    issue: 'Results is nested under Methods in the draft. The sample reference outline lists both as main sections.',
    impact: 'A reader navigating by headings could miss Results while scanning the main sections.',
    resolution: 'The author confirmed the section order and hierarchy.',
    guidance: 'Check whether the nesting reflects your intent. You can confirm the current outline or adjust its order and hierarchy.'
  },
  table: {
    title: 'Table accessibility', location: 'Table 1, page 4',
    issue: 'One Neighborhood cell spans the Residential and Commercial rows in the draft.',
    impact: 'Both sets of measurements share one label. A screen-reader user navigating to 3.5°C cannot get Commercial as the row header for that value.',
    guidance: 'Split the shared cell to give each neighborhood its own row header.'
  },
  contrast: {
    title: 'Text contrast', location: 'Discussion, page 4',
    issue: 'The discussion callout uses dark plum text on a similar background.',
    impact: 'The text can be hard to distinguish for readers with low vision.',
    guidance: 'Choose a lighter background and check the preview.'
  }
};
const sectionNames = ['Introduction', 'Methods', 'Results', 'Discussion'];

function sampleOutline(nested) {
  return sectionNames.map(name => ({ name, parent: nested && name === 'Results' ? 'Methods' : null }));
}

const order = ['figure', 'sections', 'table', 'contrast'];
const contrastText = '#633d59';
const defaultBackground = '#885e7e';
const contrastTarget = 4.5;
const hexColor = /^#[0-9a-f]{6}$/i;
const rows = [
  ['Residential', '4.2', '2.8'],
  ['Commercial', '3.5', '2.4'],
  ['Industrial', '1.1', '2.0']
];
const labels = ['Trees', 'Shade sails'];
const caption = 'Figure 2. Temperature reduction by cooling strategy and neighborhood.';
const suggestion = 'Trees reduce temperatures more than shade sails in residential (4.2°C versus 2.8°C) and commercial (3.5°C versus 2.4°C) neighborhoods. At the industrial site, shade sails cool more (2.0°C versus 1.1°C).';
const key = 'accessible-papers-final-v1';
const main = document.querySelector('#main');
const nav = document.querySelector('#nav');
const notice = document.querySelector('#notice');
const reset = document.querySelector('#reset');

function initialState() {
  return {
    started: false,
    figure: { status: 'open', value: '', note: '' },
    sections: { status: 'open', value: sampleOutline(true), note: '' },
    table: { status: 'open', value: 'merged', note: '' },
    contrast: { status: 'open', value: defaultBackground, note: '' }
  };
}

let state = initialState();
let storageAvailable = true;
try {
  state = JSON.parse(localStorage.getItem(key)) || state;
} catch {
  storageAvailable = false;
}
if (typeof state.sections.value === 'string') {
  state.sections.value = sampleOutline(state.sections.value === 'nested');
}
// Earlier table reviews used a different issue. Preserve reminders and reopen completed reviews.
if (!['merged', 'split'].includes(state.table.value)) {
  state.table.value = 'merged';
  if (state.table.status === 'reviewed') state.table.status = 'open';
}
state.contrast ??= initialState().contrast;
const previousBackgrounds = { mauve: defaultBackground, ivory: '#faf6f0', blush: '#f2e2e6' };
state.contrast.value = previousBackgrounds[state.contrast.value] ?? state.contrast.value;
let workingOutline;
let draggedSection;
let page = state.started ? 'overview' : 'start';

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function save(message) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    storageAvailable = false;
  }
  notice.textContent = message;
}

function button(action, label, primary = false, extra = '') {
  return `<button type="button" data-action="${action}" ${primary ? 'class="primary"' : ''} ${extra}>${label}</button>`;
}

function heading(title, intro, kicker = 'Urban shade study') {
  return `<div><p class="eyebrow">${kicker}</p><h1 id="view-title" tabindex="-1">${title}</h1><p class="intro">${intro}</p></div>`;
}

function status(id) {
  return { open: 'Needs review', deferred: 'Deferred – unresolved', reviewed: 'Reviewed' }[state[id].status];
}

function hasHierarchyWarning(id) {
  return id === 'sections' && state[id].status !== 'reviewed';
}

function badge(id) {
  const deferred = state[id].status === 'deferred';
  const warning = hasHierarchyWarning(id);
  const open = state[id].status === 'open';
  const severity = warning ? 'warning' : open ? 'problem' : state[id].status;
  const label = warning ? `Warning – check hierarchy${deferred ? ' – Deferred' : ''}` :
    open ? 'Needs review – issue found' : status(id);
  return `<span class="status ${severity}">${label}</span>`;
}

function outlineMarker(id, location) {
  const review = state[id];
  const issue = {
    sections: 'Warning – Check nesting',
    figure: 'Issue – Missing description',
    table: 'Issue – Merged neighborhood cell',
    contrast: 'Issue – Low text contrast'
  };
  const warning = hasHierarchyWarning(id);
  const label = warning ? `${issue[id]}${review.status === 'deferred' ? ' – Deferred' : ''}` :
    review.status === 'open' ? issue[id] : status(id);
  const tone = warning ? 'warning' : review.status === 'open' ? 'problem' : review.status;
  return `<div class="manuscript-row"><strong>${location}</strong>
    ${button(id, label + ' <span aria-hidden="true">→</span>', false,
      `class="outline-marker status ${tone}" aria-label="${location}: ${label}. Open ${catalog[id].title.toLowerCase()} review."`)}
    </div>
    ${review.note ? `<p class="note manuscript-note"><strong>Saved reminder</strong> – ${escapeHTML(review.note)}</p>` : ''}
    ${review.status === 'deferred' ? button(`defer-${id}`, 'Edit reminder', false, `aria-label="Edit reminder for ${location}"`) : ''}`;
}

function manuscriptMap() {
  return `<section class="card manuscript-map" aria-labelledby="map-title">
    <h2 id="map-title">Manuscript outline</h2>
    <p class="muted">Select a marker to open its review.</p>
    ${renderOutline(state.sections.value, ({ name }) => name === 'Results'
      ? outlineMarker('sections', name) + `<ul role="list" class="manuscript-items">
        <li>${outlineMarker('figure', 'Figure 2')}</li>
        <li>${outlineMarker('table', 'Table 1')}</li></ul>`
      : `<div class="manuscript-row"><strong>${name}</strong></div>
        ${name === 'Discussion' ? `<ul role="list" class="manuscript-items"><li>${outlineMarker('contrast', 'Discussion callout')}</li></ul>` : ''}`, null, 'manuscript-tree')}
    </section>`;
}

function overview() {
  const pending = order.filter(id => state[id].status !== 'reviewed');
  const recommended = ['table', 'sections', 'figure', 'contrast'].find(id => state[id].status === 'open');
  const recommendation = {
    table: 'Table 1 needs a separate row header for each neighborhood.',
    sections: 'Confirm whether Results belongs under Methods in the reading version.',
    figure: 'The draft figure description needs an author to verify the takeaway.',
    contrast: 'The discussion callout needs a background that makes the text easier to read.'
  };
  return `${heading('Review the reading version', 'Compare the source and sample suggestions, then choose which changes to include.')}
    <div class="callout row"><strong>${order.length - pending.length} of ${order.length} reviews complete</strong><span>${pending.length ? `${pending.length} unresolved` : 'Ready for author handoff'}</span>
    <div class="review-progress" aria-hidden="true">${order.map((_, index) => `<span class="${index < order.length - pending.length ? 'done' : ''}"></span>`).join('')}</div></div>
    ${manuscriptMap()}
    <div class="row checkpoint">
      <p>${recommended ? `<strong>Suggested next review:</strong> ${recommendation[recommended]}` :
        pending.length ? 'Deferred reviews remain visible above and in your export.' : 'All sample changes have been reviewed.'}</p>
      ${button('export', 'Preview and export', true)}
    </div>`;
}

function chart() {
  const colors = ['#633d59', '#a0526b'];
  return `<figure><svg class="chart" viewBox="0 0 440 232" role="img" aria-labelledby="chart-title chart-desc">
    <title id="chart-title">Source figure for author review</title><desc id="chart-desc">Grouped bars show the six temperature reductions listed in the figure data below.</desc>
    <text x="8" y="20" font-size="14" fill="#414141">Cooling (°C)</text>
    ${[0, 1, 2, 3, 4, 5].map(tick => `<text x="28" y="${171 - tick * 25}" font-size="12">${tick}</text><path d="M48 ${167 - tick * 25} H430" stroke="#cdbfc0"/>`).join('')}
    ${rows.map(([name, ...values], index) => {
      const x = 66 + index * 124;
      return `${values.map((value, series) => `<rect x="${x + series * 35}" y="${167 - value * 25}" width="29" height="${value * 25}" fill="${colors[series]}"/>`).join('')}
        <text x="${x + 32}" y="190" text-anchor="middle" font-size="13">${name}</text>`;
    }).join('')}
    <rect x="103" y="209" width="14" height="14" fill="${colors[0]}"/><text x="123" y="221" font-size="13">Trees (left)</text>
    <rect x="227" y="209" width="14" height="14" fill="${colors[1]}"/><text x="247" y="221" font-size="13">Shade sails (right)</text>
    </svg><figcaption>${caption}</figcaption></figure>
    <details><summary>Figure data</summary>${dataTable('Figure 2 measurements')}</details>`;
}

function dataTable(title = 'Table 1. Temperature reduction (°C)', merged = false) {
  return `<div class="table-scroll"><table><caption>${title}</caption>
    <thead><tr>${['Neighborhood', ...labels].map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead>
    ${rows.map(([name, a, b], index) => {
      const rowHeader = merged && index < 2
        ? (index === 0 ? '<th scope="rowgroup" rowspan="2" class="merged-cell">Residential / Commercial</th>' : '')
        : `<th scope="row">${name}</th>`;
      const groupStart = !merged || index !== 1 ? '<tbody>' : '';
      const groupEnd = !merged || index !== 0 ? '</tbody>' : '';
      return `${groupStart}<tr>${rowHeader}<td>${a}</td><td>${b}</td></tr>${groupEnd}`;
    }).join('')}
    </table></div>`;
}

function renderOutline(outline, renderEntry, parent = null, className = 'outline') {
  const siblings = outline.filter(section => section.parent === parent);
  if (!siblings.length) return '';
  return `<ul role="list" class="${className}">${siblings.map((section, index) =>
    `<li>${renderEntry(section, index, siblings)}${renderOutline(outline, renderEntry, section.name, className)}</li>`
  ).join('')}</ul>`;
}

function moveControls(section, index, siblings) {
  const parent = workingOutline.find(item => item.name === section.parent);
  const hasChildren = workingOutline.some(item => item.parent === section.name);
  const disabled = {
    up: index === 0,
    down: index === siblings.length - 1,
    indent: Boolean(parent) || index === 0 || hasChildren,
    outdent: !parent
  };
  const icons = { up: '↑', down: '↓', outdent: '←', indent: '→' };
  return Object.entries({ up: 'Move up', down: 'Move down', outdent: 'Make main section', indent: 'Make subsection' })
    .map(([action, label]) => `<button type="button" data-move="${action}" aria-label="${label} – ${section.name}" aria-disabled="${disabled[action]}" title="${label}"><span aria-hidden="true">${icons[action]}</span></button>`)
    .join('');
}

function sectionEditor() {
  return renderOutline(workingOutline, (section, index, siblings) => {
    const flagged = section.name === 'Results' && section.parent && state.sections.status !== 'reviewed';
    return `<div class="outline-row" draggable="true" data-section="${section.name}">
      <strong>${section.name}</strong> ${flagged ? '<span class="section-warning">Check nesting</span>' : ''}
      <div class="actions">${moveControls(section, index, siblings)}</div></div>`;
  }, null, 'outline-editor') + '<div class="outline-end" data-section="">Drop here to move to the end as a main section</div>';
}

function updateOutline(name, action, target) {
  const section = workingOutline.find(item => item.name === name);
  const siblings = workingOutline.filter(item => item.parent === section.parent);
  const index = siblings.indexOf(section);
  let before;
  if (action === 'up') before = siblings[index - 1];
  if (action === 'down') before = siblings[index + 2];
  if (action === 'indent') section.parent = siblings[index - 1].name;
  if (action === 'outdent') {
    const roots = workingOutline.filter(item => !item.parent);
    before = roots[roots.findIndex(item => item.name === section.parent) + 1];
    section.parent = null;
  }
  if (action === 'drop') {
    before = workingOutline.find(item => item.name === target);
    const parent = before?.parent ?? null;
    if (before === section || parent === name ||
        (parent && workingOutline.some(item => item.parent === name))) return false;
    section.parent = parent;
  }
  workingOutline.splice(workingOutline.indexOf(section), 1);
  const destination = before ? workingOutline.indexOf(before) : workingOutline.length;
  workingOutline.splice(destination, 0, section);
  document.querySelector('#section-outline').innerHTML = sectionEditor();
  notice.textContent = section.parent ? `${name} moved under ${section.parent}.` : `${name} moved to main section position ${workingOutline.filter(item => !item.parent).indexOf(section) + 1}.`;
  return true;
}

function sectionPanel() {
  return `<div class="grid two"><section class="card"><p class="eyebrow">Sample reference</p><h2>Reference outline</h2>
    ${renderOutline(sampleOutline(false), section => section.name)}</section>
    <form class="card" data-form="sections"><p class="eyebrow">Editable reading version</p><h2>Draft outline</h2>
    <p>Drag to reorder. Use ↑ ↓ to move within a level and ← → to outdent or indent.</p>
    <div id="section-outline">${sectionEditor()}</div>
    <div class="actions"><button class="primary" type="submit">Confirm outline</button>
    ${state.sections.status !== 'reviewed' ? button('defer-sections', 'Review later') : ''}</div></form></div>`;
}

function context(id) {
  const item = catalog[id];
  const warning = id === 'sections';
  if (warning && state.sections.status === 'reviewed') {
    return '<div class="callout"><h2>Outline confirmed</h2><p>You can revise the reading order and hierarchy below, then confirm the outline again.</p></div>';
  }
  return `<div class="callout ${warning ? 'warning' : 'problem'}"><h2>${warning ? 'Potential hierarchy issue – Results' : 'Original review finding'}</h2><p>${item.issue} ${item.impact}</p>${warning ? `<p>${item.guidance}</p>` : ''}</div>`;
}

function figurePanel() {
  const reviewed = state.figure.status === 'reviewed';
  return `<div class="grid two">
    <section class="card"><p class="eyebrow">Source paper</p><h2>Figure 2</h2>${chart()}<p>No description is attached in the source.</p></section>
    <section class="card ${reviewed ? '' : 'ai-draft-card'}">
    ${reviewed ? '<p class="eyebrow">Author approved</p>' : `<div class="ai-draft-header">
      <span class="ai-draft-label"><span aria-hidden="true">✦</span> AI draft</span>
      <span class="ai-draft-state">Awaiting your review</span>
    </div>`}
    <h2>${reviewed ? 'Included description' : 'Suggested figure description'}</h2>
    ${reviewed ? '' : '<p class="muted ai-draft-detail">Simulated AI output for this prototype.</p>'}
    <p class="note ${reviewed ? '' : 'ai-draft-text'}">${escapeHTML(reviewed ? state.figure.value : suggestion)}</p>
    <p class="muted">${catalog.figure.guidance}</p><div class="actions">
    ${reviewed ? button('edit-description', 'Edit included description', true) : button('use-description', 'Use description', true) + button('edit-description', 'Edit AI draft')}
    ${button('write-description', 'Write my own')}${!reviewed ? button('defer-figure', 'Review later') : ''}</div></section></div>`;
}

function tablePanel() {
  const split = state.table.value === 'split';
  const reviewed = state.table.status === 'reviewed';
  return `<div class="grid two"><section class="card"><p class="eyebrow">Source paper</p><h2>One header per row</h2>${dataTable()}</section>
    <form class="card" data-form="table"><p class="eyebrow">Editable reading version</p>
    <h2>Draft table</h2>
    <input type="hidden" name="layout" value="${split ? 'split' : 'merged'}">
    <div id="comparison">${tablePreview(split)}</div>
    <p id="table-reading-cue" role="status">${tableReadingCue(split)}</p>
    <p id="table-error" role="alert"></p>
    <div class="actions">${button('split-table-cell', split ? 'Restore merged cell' : 'Split merged cell')}
    <button class="primary" type="submit">Save table</button>
    ${!reviewed ? button('defer-table', 'Review later') : ''}</div></form></div>`;
}

function tablePreview(split) {
  return dataTable('Table 1. Temperature reduction (°C)', !split);
}

function tableReadingCue(split) {
  return split ? '3.5°C now has its own row context: Commercial, Trees.' :
    '3.5°C shares the Residential / Commercial header with the row above.';
}

function contrastRatio(background) {
  const luminance = color => [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const offset = 1 + index * 2;
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return total + weight * linear;
  }, 0);
  const text = luminance(contrastText);
  const surface = luminance(background);
  return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05);
}

function contrastSample(background) {
  return `<p class="contrast-sample" style="color:${contrastText};background-color:${background}">Shade recommendations should account for neighborhood conditions.</p>`;
}

function contrastCue(background) {
  const ratio = contrastRatio(background);
  const meetsTarget = ratio >= contrastTarget;
  const percent = meetsTarget ? 100 : Math.floor(ratio / contrastTarget * 100);
  const shownRatio = (Math.floor(ratio * 100) / 100).toFixed(2);
  return `<strong>${shownRatio}:1</strong> – ${percent}% of target – ${meetsTarget ? 'Meets' : 'Below'} 4.5:1 minimum`;
}

function contrastPanel() {
  const value = state.contrast.value;
  return `<form class="card contrast-editor" data-form="contrast">
    <h2>Discussion callout</h2>
    <p>The original colors can be hard to distinguish for readers with low vision. Choose a background for the dark text.</p>
    <div class="contrast-workspace"><div class="contrast-controls">
      <div><label for="background-picker">Background color</label>
      <input id="background-picker" type="color" value="${value}"></div>
      <div><label for="background">Hex color</label>
      <input id="background" name="background" value="${value}" required pattern="#[0-9a-fA-F]{6}" title="Enter a six-digit hex color, such as #faf6f0." spellcheck="false" autocapitalize="off"></div>
    </div>
    <div class="contrast-result"><div id="contrast-preview">${contrastSample(value)}</div>
    <p id="contrast-cue" role="status">${contrastCue(value)}</p></div></div>
    <p id="contrast-error" role="alert"></p>
    <div class="actions"><button type="submit" class="primary">Save background</button>
    ${state.contrast.status !== 'reviewed' ? button('defer-contrast', 'Review later') : ''}</div></form>`;
}

function reviewFeedback(id) {
  const reviewState = state[id];
  if (reviewState.status === 'deferred') {
    return `<section class="callout review-feedback" tabindex="-1" id="review-feedback">
      <h2>Review deferred</h2><p>This review remains unresolved.</p>
      ${reviewState.note ? `<p class="note"><strong>Saved reminder</strong><br>${escapeHTML(reviewState.note)}</p>` : ''}
      ${button(`defer-${id}`, 'Edit reminder')}</section>`;
  }
  const results = state.sections.value.find(section => section.name === 'Results');
  const detail = {
    figure: 'The description shown below is saved and approved for Figure 2.',
    sections: results.parent ? `Results is saved as a subsection under ${results.parent}.` : 'Results is saved as a main section.',
    table: 'Residential and Commercial now have separate row headers. All measurements stayed the same.',
    contrast: `The discussion callout now uses a ${state.contrast.value.toUpperCase()} background behind the dark text.`
  };
  const title = { figure: 'Description approved', sections: 'Outline confirmed', table: 'Table saved', contrast: 'Background saved' };
  return `<section class="callout review-feedback" tabindex="-1" id="review-feedback"><h2>${title[id]}</h2><p>${detail[id]}</p></section>`;
}

function savedLayout(id) {
  if (id === 'sections') {
    return `<div class="card saved-outline">
      ${reviewFeedback(id)}
      <section aria-labelledby="saved-outline-title">
        <div class="row"><h2 id="saved-outline-title">Saved outline</h2>${button('edit-sections', 'Edit outline')}</div>
        ${renderOutline(state.sections.value, section => section.name)}
      </section>
    </div>`;
  }
  if (id === 'contrast') {
    const value = state.contrast.value;
    return `<section class="card saved-contrast" aria-labelledby="contrast-saved-title">
      <div class="row"><div id="review-feedback" tabindex="-1">
        <h2 id="contrast-saved-title">Background saved</h2>
        <p class="muted">Discussion callout – ${value.toUpperCase()}</p>
      </div>${button('edit-contrast', 'Edit background')}</div>
      ${contrastSample(value)}<p class="saved-contrast-metric">${contrastCue(value)}</p>
    </section>`;
  }
  return `<section class="card"><h2>Saved Table 1</h2>${dataTable()}
    ${button('edit-table', 'Edit table')}</section>`;
}

function review(id, editing) {
  const item = catalog[id];
  const status = state[id].status;
  const reviewed = status === 'reviewed';
  const hasInlineConfirmation = reviewed && !editing && (id === 'sections' || id === 'contrast');
  const panel = id === 'figure' ? figurePanel() : reviewed && !editing ? savedLayout(id) :
    id === 'sections' ? sectionPanel() : id === 'contrast' ? contrastPanel() : tablePanel();
  return `<div class="stack review-page"><div><h1 id="view-title" tabindex="-1">${item.title}</h1>
    <dl class="source-location"><dt>Source location</dt><dd>${item.location}</dd></dl></div>
    ${hasInlineConfirmation ? '' : badge(id)}
    ${status !== 'open' && !editing && !hasInlineConfirmation ? reviewFeedback(id) : ''}
    ${reviewed || id === 'contrast' ? '' : context(id)}${panel}
    <div class="actions">${button('overview', 'Back to paper outline', reviewed && !editing)}
      ${reviewed ? button(editing ? id : `reopen-${id}`, editing ? 'Cancel edit' : 'Undo review') : ''}</div></div>`;
}

function descriptionEditor(mode) {
  const editingDraft = mode === 'edit-description' && state.figure.status !== 'reviewed';
  const text = mode === 'write-description' ? '' : editingDraft ? suggestion : state.figure.value;
  return `<div class="stack">${heading(mode === 'write-description' ? 'Write your own description' : editingDraft ? 'Edit the AI draft' : 'Edit the description', 'State what a reader should take away from Figure 2.')}
    <div class="grid two"><section class="card"><p class="eyebrow">Source paper</p><h2>Figure 2</h2>${chart()}</section>
    <form class="card" data-form="description">
      <label for="takeaway">Intended takeaway (optional)</label><textarea id="takeaway" rows="2" placeholder="Which strategy cools more, and where does the pattern reverse?"></textarea>
      ${editingDraft ? '<p class="ai-draft-label"><span aria-hidden="true">✦</span> Simulated AI draft</p>' : ''}
      <label for="description">Description to include</label>
      <textarea id="description" name="description" rows="7" maxlength="3000" required aria-describedby="description-help">${escapeHTML(text)}</textarea>
      <p id="description-help" class="muted">${catalog.figure.guidance}</p>
      <div class="actions"><button class="primary" type="submit">Save and use description</button>${button('insert-suggestion', 'Insert AI draft', false, text ? 'hidden' : '')}${button('figure', 'Cancel edit')}</div>
    </form></div></div>`;
}

function deferEditor(id) {
  return `${heading(state[id].status === 'deferred' ? 'Edit reminder' : 'Review later', `${catalog[id].title} will remain unresolved.`)}
    <form class="card" data-form="defer-${id}">
    <label for="reminder">Reminder for this review (optional)</label>
    <textarea id="reminder" name="reminder" rows="4" maxlength="1000" placeholder="Example: Check Table 1 labels with my coauthor.">${escapeHTML(state[id].note)}</textarea>
    <div class="actions"><button class="primary" type="submit">Save reminder and defer</button>${button('overview', 'Cancel')}</div></form>`;
}

function reviewNotes() {
  const unresolved = order.filter(id => state[id].status !== 'reviewed');
  return `${unresolved.length ? `Draft – ${unresolved.length} unresolved` : 'All sample reviews complete'}\n\n` +
    order.map(id => `${catalog[id].title} — ${status(id)}${state[id].note ? `\nReminder: ${state[id].note}` : ''}`).join('\n\n');
}

let samplePdfUrl;

function exportView() {
  samplePdfUrl ??= URL.createObjectURL(new Blob([
    Uint8Array.from(atob(correctedSamplePdf), byte => byte.charCodeAt(0))
  ], { type: 'application/pdf' }));
  const complete = order.filter(id => state[id].status === 'reviewed').length;
  return `<div class="export-page">
    <h1 id="view-title" tabindex="-1">Preview and export</h1>
    <div class="card export-card">
      <section class="export-file" aria-labelledby="pdf-title">
        <div><p class="eyebrow">Corrected PDF</p><h2 id="pdf-title">Urban Shade and Neighborhood Cooling</h2></div>
        <div class="actions"><a class="pdf-download" href="${samplePdfUrl}" download="urban-shade-corrected.pdf">Download PDF</a>
        <a class="pdf-preview" href="${samplePdfUrl}" target="_blank" rel="noopener">Open PDF in new tab</a></div>
      </section>
      <section class="export-progress" aria-labelledby="export-progress-title">
        <div class="row"><h2 id="export-progress-title">Review progress</h2><span>${complete} of ${order.length} complete</span></div>
        <ul class="export-reviews" role="list">${order.map(id => `<li>
          <div class="row"><strong>${catalog[id].title}</strong>${badge(id)}</div>
          ${state[id].note ? `<p class="note muted">${escapeHTML(state[id].note)}</p>` : ''}
        </li>`).join('')}</ul>
        <div class="actions">${button('download-notes', 'Download review notes')}${button('overview', 'Back to paper outline')}</div>
      </section>
    </div></div>`;
}

function show(next, focus = true, editing = false) {
  page = next;
  if (page === 'sections') workingOutline = state.sections.value.map(section => ({ ...section }));
  nav.innerHTML = state.started ? [
    button('overview', 'Paper outline', false, page === 'overview' ? 'aria-current="page"' : ''),
    button('export', 'Preview &amp; export', false, page === 'export' ? 'aria-current="page"' : ''),
    button('reset', 'Restart sample', false, 'aria-haspopup="dialog"')
  ].join('') : '';
  if (catalog[page]) main.innerHTML = review(page, editing);
  else if (page.startsWith('defer-')) main.innerHTML = deferEditor(page.slice(6));
  else if (page.endsWith('-description')) main.innerHTML = descriptionEditor(page);
  else if (page === 'overview') main.innerHTML = overview();
  else if (page === 'export') main.innerHTML = exportView();
  else main.innerHTML = `${heading('Add your paper', 'Create a draft reading version and review it before sharing.', 'Manuscript accessibility')}
    <section class="hero card"><div><p class="eyebrow">Sample paper selected</p><h2>Urban shade study.pdf</h2>
    <p>Compare how trees and shade sails cool residential, commercial, and industrial neighborhoods.</p>
    <p>This prototype simulates paper selection using the built-in sample.</p>
    <div class="actions"><button type="button" disabled>Choose another PDF</button>
    ${button('start', 'Create draft reading version', true)}</div></div>
    <div class="hero-art" aria-hidden="true"><div class="sheet">
      <div class="sheet-lines"><i></i><i></i><i></i></div>
      <div class="sheet-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    </div></div></section>`;
  if (!storageAvailable) main.insertAdjacentHTML('afterbegin', '<p class="callout">Browser storage is unavailable. Download your review record before closing.</p>');
  if (focus) document.querySelector('#view-title').focus();
}

function complete(id, value) {
  state[id] = { status: 'reviewed', value, note: '' };
  save(`${catalog[id].title} saved. ${order.filter(item => state[item].status !== 'reviewed').length} reviews remain unresolved.`);
  show(id, false);
  document.querySelector('#review-feedback').focus();
}

function download(filename, body, type) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice.textContent = `Download requested: ${filename}`;
}

document.addEventListener('click', event => {
  const action = event.target.closest('button[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'start') {
    state.started = true;
    save('Draft created. Four reviews are available.');
    show('overview');
  } else if (action === 'use-description') {
    complete('figure', suggestion);
  } else if (action === 'insert-suggestion') {
    const field = document.querySelector('#description');
    if (field.value.trim()) return;
    field.value = suggestion;
    field.focus();
    notice.textContent = 'Simulated AI draft inserted in the editor. Review it before saving.';
  } else if (action === 'split-table-cell') {
    const control = event.target.closest('button');
    const layout = control.form.elements.layout;
    const split = layout.value === 'merged';
    layout.value = split ? 'split' : 'merged';
    control.textContent = split ? 'Restore merged cell' : 'Split merged cell';
    document.querySelector('#comparison').innerHTML = tablePreview(split);
    document.querySelector('#table-reading-cue').textContent = tableReadingCue(split);
    document.querySelector('#table-error').textContent = '';
  } else if (action === 'edit-sections' || action === 'edit-table' || action === 'edit-contrast') {
    show(action.slice(5), true, true);
  } else if (action.startsWith('reopen-')) {
    const id = action.slice(7);
    state[id] = initialState()[id];
    save(`${catalog[id].title} review undone.`);
    show(id);
  } else if (action === 'download-notes') {
    download('urban-shade-review-notes.txt', `Urban shade study – Review notes\n\n${reviewNotes()}\n`, 'text/plain;charset=utf-8');
  } else if (action === 'reset') {
    reset.returnValue = '';
    reset.showModal();
  } else {
    show(action);
  }
});

main.addEventListener('click', event => {
  const control = event.target.closest('[data-move]');
  if (!control || control.getAttribute('aria-disabled') === 'true') return;
  const name = control.closest('[data-section]').dataset.section;
  const action = control.dataset.move;
  updateOutline(name, action);
  main.querySelector(`[data-section="${name}"] [data-move="${action}"]`).focus();
});

main.addEventListener('dragstart', event => {
  const row = event.target.closest('.outline-row');
  if (!row) return;
  draggedSection = row.dataset.section;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedSection);
});

function clearDropTargets() {
  main.querySelectorAll('.drop-target').forEach(row => row.classList.remove('drop-target'));
}

main.addEventListener('dragover', event => {
  const row = event.target.closest('[data-section]');
  if (!row || !draggedSection) return;
  event.preventDefault();
  clearDropTargets();
  row.classList.add('drop-target');
});

main.addEventListener('drop', event => {
  const row = event.target.closest('[data-section]');
  if (!row || !draggedSection) return;
  event.preventDefault();
  if (!updateOutline(draggedSection, 'drop', row.dataset.section)) {
    notice.textContent = 'This drop would create an unsupported nesting. Choose another row.';
  }
  clearDropTargets();
  draggedSection = null;
});

main.addEventListener('dragend', () => {
  clearDropTargets();
  draggedSection = null;
});

main.addEventListener('input', event => {
  if (event.target.id === 'background' || event.target.id === 'background-picker') {
    const input = document.querySelector('#background');
    const picker = document.querySelector('#background-picker');
    if (event.target === picker) input.value = picker.value;
    const background = input.value;
    if (!hexColor.test(background)) return;
    picker.value = background;
    document.querySelector('#contrast-preview .contrast-sample').style.backgroundColor = background;
    document.querySelector('#contrast-cue').innerHTML = contrastCue(background);
    document.querySelector('#contrast-error').textContent = '';
    return;
  }
  if (event.target.id === 'description') {
    event.target.setCustomValidity('');
    document.querySelector('[data-action="insert-suggestion"]').hidden = Boolean(event.target.value.trim());
  }
});

main.addEventListener('submit', event => {
  const form = event.target;
  const kind = form.dataset.form;
  event.preventDefault();
  const fields = new FormData(form);
  if (kind === 'description') {
    const value = fields.get('description').trim();
    if (!value) {
      const field = form.elements.description;
      field.setCustomValidity('Enter a description before saving.');
      field.reportValidity();
      return;
    }
    complete('figure', value);
  } else if (kind.startsWith('defer-')) {
    const id = kind.slice(6);
    state[id] = { ...state[id], status: 'deferred', note: fields.get('reminder').trim() };
    save(`${catalog[id].title} deferred. Reminder saved if entered.`);
    show(id, false);
    document.querySelector('#review-feedback').focus();
  } else if (kind === 'sections') {
    complete('sections', workingOutline);
  } else if (kind === 'contrast') {
    const background = fields.get('background');
    if (!hexColor.test(background) || contrastRatio(background) < contrastTarget) {
      document.querySelector('#contrast-error').textContent = 'Choose a background that reaches the 4.5:1 contrast minimum.';
      form.elements.background.focus();
      return;
    }
    complete('contrast', background.toLowerCase());
  } else {
    if (fields.get('layout') !== 'split') {
      document.querySelector('#table-error').textContent = 'Split the shared cell before saving the table.';
      form.querySelector('[data-action="split-table-cell"]').focus();
      return;
    }
    complete('table', 'split');
  }
});

reset.addEventListener('close', () => {
  if (reset.returnValue !== 'reset') return;
  state = initialState();
  save('Sample review reset. The sample paper is ready to open.');
  show('start');
});

show(page, false);
