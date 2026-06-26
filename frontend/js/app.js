const STATUSES = [
  { key: 'nouveau', label: 'Nouveau' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'resolu', label: 'Résolu' },
  { key: 'ferme', label: 'Fermé' },
];

const user = getUser();
if (!user || !getToken()) {
  window.location.href = '/login.html';
}

document.getElementById('who-username').textContent = user.username;
document.getElementById('who-role').textContent = user.role;

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  window.location.href = '/login.html';
});

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => {
    document.getElementById(el.dataset.close).style.display = 'none';
  });
});

function renderBoard(incidents) {
  const board = document.getElementById('board');
  board.innerHTML = '';

  STATUSES.forEach((s) => {
    const items = incidents.filter((i) => i.status === s.key);

    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `
      <div class="column-head"><span>${s.label}</span><span>${items.length}</span></div>
      <div class="column-body"></div>
    `;
    const body = col.querySelector('.column-body');

    if (items.length === 0) {
      body.innerHTML = '<div class="empty-col">Aucun incident</div>';
    } else {
      items.forEach((i) => body.appendChild(renderCard(i)));
    }

    board.appendChild(col);
  });
}

function renderCard(incident) {
  const card = document.createElement('div');
  card.className = `card sev-${incident.severity}`;
  card.innerHTML = `
    <div class="id">#${incident.id} · ${incident.severity.toUpperCase()}</div>
    <div class="title">${escapeHtml(incident.title)}</div>
    <div class="meta">
      <span>${incident.category || '—'}</span>
      <span>${incident.assigned_username || 'non assigné'}</span>
    </div>
  `;
  card.addEventListener('click', () => openDetail(incident.id));
  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadIncidents() {
  const severity = document.getElementById('filter-severity').value;
  const params = severity ? { severity } : {};
  try {
    const incidents = await Api.listIncidents(params);
    renderBoard(incidents);
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('filter-severity').addEventListener('change', loadIncidents);

// ---- Détail incident ----
async function openDetail(id) {
  const overlay = document.getElementById('detail-overlay');
  const modal = document.getElementById('detail-modal');
  const incident = await Api.getIncident(id);
  const canEdit = user.role === 'admin' || user.role === 'analyste';

  modal.innerHTML = `
    <span class="close" id="close-detail">&times;</span>
    <h2>#${incident.id} — ${escapeHtml(incident.title)}</h2>
    <p style="color:var(--muted);">${escapeHtml(incident.description || 'Pas de description')}</p>

    ${canEdit ? `
    <div class="field">
      <label>Statut</label>
      <select class="full" id="edit-status">
        ${STATUSES.map((s) => `<option value="${s.key}" ${s.key === incident.status ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
    </div>` : `<p><strong>Statut :</strong> ${incident.status}</p>`}

    <div class="timeline">
      <strong style="font-size:12px;color:var(--muted);">Timeline / investigation</strong>
      ${incident.comments.map((c) => `
        <div class="timeline-entry">
          <div class="meta">${c.author_username || 'système'} · ${new Date(c.created_at).toLocaleString('fr-FR')}</div>
          <div>${escapeHtml(c.content)}</div>
        </div>
      `).join('') || '<p style="font-size:12px;color:var(--muted);">Aucune entrée</p>'}
    </div>

    ${canEdit ? `
    <div class="field">
      <label>Ajouter une note</label>
      <textarea class="full" id="new-comment" rows="3"></textarea>
      <button class="btn" id="add-comment-btn" style="margin-top:8px;">Ajouter</button>
    </div>` : ''}
    <p class="error-msg" id="detail-error"></p>
  `;

  overlay.style.display = 'flex';
  document.getElementById('close-detail').addEventListener('click', () => overlay.style.display = 'none');

  if (canEdit) {
    document.getElementById('edit-status').addEventListener('change', async (e) => {
      try {
        await Api.updateIncident(id, { status: e.target.value });
        loadIncidents();
      } catch (err) {
        document.getElementById('detail-error').textContent = err.message;
      }
    });

    document.getElementById('add-comment-btn').addEventListener('click', async () => {
      const content = document.getElementById('new-comment').value.trim();
      if (!content) return;
      try {
        await Api.addComment(id, content);
        openDetail(id); // refresh
      } catch (err) {
        document.getElementById('detail-error').textContent = err.message;
      }
    });
  }
}

// ---- Nouvel incident ----
document.getElementById('new-incident-btn').addEventListener('click', () => {
  document.getElementById('new-overlay').style.display = 'flex';
});

document.getElementById('new-incident-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    severity: form.severity.value,
    category: form.category.value.trim(),
  };
  try {
    await Api.createIncident(data);
    document.getElementById('new-overlay').style.display = 'none';
    form.reset();
    loadIncidents();
  } catch (err) {
    document.getElementById('new-error').textContent = err.message;
  }
});

loadIncidents();
