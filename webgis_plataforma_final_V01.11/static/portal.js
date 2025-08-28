// Portal WebGIS – mapa, camadas, legenda, identify, AOI, persistência de estado
(function() {
  const portalEl = document.getElementById('portal');
  if (!portalEl) return;

  const companySlug = portalEl.getAttribute('data-company-slug');
  const stateKey = (k) => `webgis:${companySlug}:${k}`;

  const basemapSelect = document.getElementById('basemap-select');
  const layersPanel = document.getElementById('layers-panel');
  const layersCount = document.getElementById('layers-count');
  const searchInput = document.getElementById('layer-search');
  const extentOnlyCheckbox = document.getElementById('extent-only');
  const btnDraw = document.getElementById('btn-draw');
  const btnBuffer = document.getElementById('btn-buffer');
  const btnClearAoi = document.getElementById('btn-clear-aoi');

  const map = L.map('map');
  const basemaps = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap'}),
    esri_imagery: L.esri.basemapLayer('Imagery'),
    esri_streets: L.esri.basemapLayer('Streets'),
    stamen_terrain: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {subdomains: 'abcd', maxZoom: 18, attribution: 'Map tiles by Stamen Design'})
  };
  let activeBasemap = null;

  function setBasemap(key) {
    if (activeBasemap) { map.removeLayer(activeBasemap); }
    activeBasemap = basemaps[key] || basemaps.osm;
    activeBasemap.addTo(map);
    basemapSelect.value = key;
    localStorage.setItem(stateKey('basemap'), key);
  }

  const savedCenter = JSON.parse(localStorage.getItem(stateKey('center')) || 'null');
  const savedZoom = JSON.parse(localStorage.getItem(stateKey('zoom')) || 'null');
  map.setView(savedCenter || [-19.91, -43.93], savedZoom || 12);
  setBasemap(localStorage.getItem(stateKey('basemap')) || 'osm');
  L.control.scale({metric:true, imperial:false}).addTo(map);
  map.on('moveend', () => {
    localStorage.setItem(stateKey('center'), JSON.stringify(map.getCenter()));
    localStorage.setItem(stateKey('zoom'), JSON.stringify(map.getZoom()));
  });

  // AOI / Desenho
  let aoiLayer = null;
  let drawControl = null;
  function enableDraw() {
    if (drawControl) { map.removeControl(drawControl); }
    drawControl = new L.Control.Draw({
      draw: { polygon: true, polyline: false, rectangle: true, circle: false, marker: false, circlemarker: false },
      edit: { featureGroup: aoiLayer ? L.featureGroup([aoiLayer]) : new L.FeatureGroup() }
    });
    map.addControl(drawControl);
  }
  btnDraw.addEventListener('click', () => enableDraw());
  map.on(L.Draw.Event.CREATED, function (e) {
    if (aoiLayer) { map.removeLayer(aoiLayer); }
    aoiLayer = e.layer; aoiLayer.addTo(map);
    btnBuffer.disabled = false; btnClearAoi.disabled = false;
    persistState(); updateActiveLayers();
  });
  btnClearAoi.addEventListener('click', () => {
    if (aoiLayer) { map.removeLayer(aoiLayer); aoiLayer = null; }
    btnBuffer.disabled = true; btnClearAoi.disabled = true;
    persistState(); updateActiveLayers();
  });
  btnBuffer.addEventListener('click', async () => {
    if (!aoiLayer) return;
    try {
      const geom = aoiLayer.toGeoJSON().geometry;
      const resp = await fetch(`/api/analysis/buffer`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({geometry: geom, distance_meters: 200})});
      if (!resp.ok) {
        if (resp.status === 401) { alert('Faça login para usar a ferramenta de Buffer.'); return; }
        throw new Error(`Erro ${resp.status}`);
      }
      const data = await resp.json();
      if (data && data.features) {
        if (aoiLayer) map.removeLayer(aoiLayer);
        aoiLayer = L.geoJSON(data, {style:{color:'#ff6600'}}).addTo(map);
        map.fitBounds(aoiLayer.getBounds());
        persistState(); updateActiveLayers();
      }
    } catch(e) { console.error(e); }
  });

  function persistState() {
    const activeIds = Object.keys(activeLayerIdToLeafletLayer).map(id => parseInt(id));
    localStorage.setItem(stateKey('activeLayers'), JSON.stringify(activeIds));
    localStorage.setItem(stateKey('extentOnly'), JSON.stringify(extentOnlyCheckbox.checked));
    localStorage.setItem(stateKey('aoi'), JSON.stringify(aoiLayer ? aoiLayer.toGeoJSON() : null));
  }

  // Camadas
  let allLayers = [];
  const activeLayerIdToLeafletLayer = {};

  function layerLegendHTML(layer) {
    if (!layer.symbology) return '';
    try {
      const s = layer.symbology;
      const g = s.geometry_type || 'polygon';
      const swatch = (fill, stroke, weight, label, opts={}) => {
        if (g === 'point') {
          const r = (opts.radius || 6)*2;
          return `<div class='d-flex align-items-center gap-2 mb-1'><span style="display:inline-block;width:${r}px;height:${r}px;border-radius:50%;background:${fill};border:${weight||2}px solid ${stroke}"></span> ${label}</div>`;
        } else if (g === 'line') {
          const dash = opts.dash || '';
          return `<div class='d-flex align-items-center gap-2 mb-1'><span style="display:inline-block;width:28px;height:${(weight||2)}px;background:${stroke};border-bottom:${(weight||2)}px ${dash? 'dashed':'solid'} ${stroke}"></span> ${label}</div>`;
        }
        return `<div class="d-flex align-items-center gap-2 mb-1"><span style="display:inline-block;width:14px;height:14px;background:${fill};border:2px solid ${stroke}"></span> ${label}</div>`;
      };
      if (s.style_type === 'single') {
        return swatch(s.fill || '#3388ff', s.color || '#3388ff', s.weight || 2, layer.name, {radius: s.radius, dash: s.dashArray});
      }
      if (s.style_type === 'categorized' && Array.isArray(s.rules)) {
        return s.rules.map(r => swatch(r.fill||'#3388ff', r.color||'#333', r.weight||2, r.value, {radius:r.radius, dash:r.dashArray})).join('');
      }
      if (s.style_type === 'graduated' && Array.isArray(s.rules)) {
        return s.rules.map(r => swatch(r.fill||'#3388ff', r.color||'#333', r.weight||2, `${r.min} - ${r.max}`, {radius:r.radius, dash:r.dashArray})).join('');
      }
    } catch(e) { return ''; }
    return '';
  }

  function applyLayerStyle(feature, layer, style) {
    if (!style) return;
    try {
      const g = style.geometry_type || 'polygon';
      const setCommon = (opt) => {
        const o = Object.assign({color:'#3388ff', weight:1.5, fillColor:'#3388ff', fillOpacity:0.2}, opt||{});
        if (g === 'line') {
          const lo = {};
          if (typeof o.opacity === 'number') lo.opacity = o.opacity;
          if (o.dashArray) lo.dashArray = o.dashArray;
          layer.setStyle(Object.assign({color: o.color || '#3388ff', weight: o.weight || 2}, lo));
        } else {
          layer.setStyle({color: o.color || '#3388ff', weight: o.weight || 2, fillColor: o.fillColor || o.fill || '#3388ff', fillOpacity: typeof o.fillOpacity === 'number' ? o.fillOpacity : 0.2});
        }
        if (g === 'point' && typeof o.radius === 'number' && layer.setRadius) layer.setRadius(o.radius);
      };
      if (style.style_type === 'single') {
        setCommon({color: style.color, weight: style.weight, fillColor: style.fill, fillOpacity: style.fillOpacity, opacity: style.opacity, dashArray: style.dashArray, radius: style.radius});
      } else if (style.style_type === 'categorized') {
        const field = style.field; const value = feature.properties ? feature.properties[field] : undefined;
        const rule = (style.rules || []).find(r => r.value == value);
        if (rule) setCommon({color: rule.color, weight: rule.weight, fillColor: rule.fill, fillOpacity: rule.fillOpacity, opacity: rule.opacity, dashArray: rule.dashArray, radius: rule.radius});
      } else if (style.style_type === 'graduated') {
        const field = style.field; const v = Number(feature.properties ? feature.properties[field] : NaN);
        const rule = (style.rules || []).find(r => v >= r.min && r.max > v);
        if (rule) setCommon({color: rule.color, weight: rule.weight, fillColor: rule.fill, fillOpacity: rule.fillOpacity, opacity: rule.opacity, dashArray: rule.dashArray, radius: rule.radius});
      }
    } catch(e) {}
  }

  function bboxQueryAroundPoint(latlng) {
    const p = map.latLngToContainerPoint(latlng);
    const pad = 8;
    const sw = map.containerPointToLatLng(L.point(p.x - pad, p.y + pad));
    const ne = map.containerPointToLatLng(L.point(p.x + pad, p.y - pad));
    return `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
  }

  async function fetchLayerGeoJSON(layerMeta, opts={}) {
    const urlBase = `/portal/${companySlug}/api/camada_data/${layerMeta.id}`;
    const params = new URLSearchParams();
    if (opts.bbox) params.set('bbox', opts.bbox);
    const url = `${urlBase}?${params.toString()}`;
    if (opts.clipGeometry) {
      const resp = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({clip_geometry: opts.clipGeometry})});
      return await resp.json();
    } else {
      const resp = await fetch(url);
      return await resp.json();
    }
  }

  function renderLayersPanel(list) {
    layersPanel.innerHTML = '';
    let total = 0;
    Object.keys(list).forEach(projectName => {
      const header = document.createElement('div');
      header.className = 'small text-muted mt-2'; header.textContent = projectName;
      layersPanel.appendChild(header);
      list[projectName].forEach(layer => {
        total++;
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex align-items-center justify-content-between';
        const left = document.createElement('div'); left.className = 'form-check';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'form-check-input'; cb.id = `layer-${layer.id}`;
        const label = document.createElement('label'); label.className = 'form-check-label ms-2'; label.htmlFor = cb.id; label.textContent = layer.name;
        left.appendChild(cb); left.appendChild(label);
        const right = document.createElement('div'); right.className = 'btn-group btn-group-sm';
        const btnMeta = document.createElement('button'); btnMeta.className='btn btn-outline-secondary'; btnMeta.innerHTML='ℹ️';
        const btnTable = document.createElement('button'); btnTable.className='btn btn-outline-secondary'; btnTable.innerHTML='📊';
        const btnLabels = document.createElement('button'); btnLabels.className='btn btn-outline-secondary'; btnLabels.innerHTML='🏷️'; btnLabels.title='Alternar rótulos';
        const aDownload = document.createElement('a'); aDownload.className='btn btn-outline-secondary'; aDownload.textContent='⬇'; aDownload.href=`/api/layer/download/${layer.id}`;
        right.appendChild(btnMeta); right.appendChild(btnTable); right.appendChild(btnLabels); right.appendChild(aDownload);
        item.appendChild(left); item.appendChild(right);
        layersPanel.appendChild(item);

        cb.addEventListener('change', async () => {
          if (cb.checked) { await addLayerToMap(layer); } else { removeLayerFromMap(layer.id); }
          persistState(); updateLegend();
        });
        btnMeta.addEventListener('click', () => openMetadata(layer.id));
        btnTable.addEventListener('click', () => openAttributeTable(layer));
        btnLabels.addEventListener('click', () => toggleLayerLabels(layer.id));
      });
    });
    layersCount.textContent = total;
  }

  function removeLayerFromMap(id) {
    const l = activeLayerIdToLeafletLayer[id];
    if (l) { 
      // Remover rótulos se existirem
      if (l._labelLayer) {
        map.removeLayer(l._labelLayer);
        l._labelLayer = null;
      }
      map.removeLayer(l); 
      delete activeLayerIdToLeafletLayer[id]; 
    }
  }

  async function addLayerToMap(layerMeta) {
    try {
      const opts = {};
      if (extentOnlyCheckbox.checked) {
        const b = map.getBounds();
        opts.bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
      }
      if (aoiLayer) opts.clipGeometry = aoiLayer.toGeoJSON().geometry;
      const gj = await fetchLayerGeoJSON(layerMeta, opts);
      const style = layerMeta.symbology || {};
      const gjLayer = L.geoJSON(gj, {
        style: function() { return {color:'#3388ff', weight:1.5, fillColor:'#3388ff', fillOpacity:0.2}; },
        pointToLayer: function(feature, latlng) {
          const radius = (style && typeof style.radius === 'number') ? style.radius : 6;
          return L.circleMarker(latlng, {radius, color:'#3388ff', weight:1.5, fillColor:'#3388ff', fillOpacity:0.2});
        },
        onEachFeature: function(feature, lf) {
          if (layerMeta.symbology) applyLayerStyle(feature, lf, layerMeta.symbology);
        }
      }).addTo(map);
      activeLayerIdToLeafletLayer[layerMeta.id] = gjLayer;
      applyLabelsToLayer(layerMeta.id); // Aplicar rótulos após adicionar a camada
    } catch(e) { console.error('Erro ao adicionar camada', e); }
  }

  function updateActiveLayers() {
    const ids = Object.keys(activeLayerIdToLeafletLayer);
    ids.forEach(async (id) => {
      const meta = allLayers.find(l => l.id === Number(id));
      if (!meta) return;
      removeLayerFromMap(id);
      await addLayerToMap(meta);
    });
    updateLegend();
  }

  function updateLegend() {
    const legend = document.getElementById('legend'); legend.innerHTML = '';
    const activeIds = Object.keys(activeLayerIdToLeafletLayer).map(Number);
    allLayers.filter(l => activeIds.includes(l.id)).forEach(l => {
      const wrap = document.createElement('div'); wrap.className = 'mb-2';
      wrap.innerHTML = `<div class='fw-bold small mb-1'>${l.name}</div>` + layerLegendHTML(l);
      legend.appendChild(wrap);
    });
  }

  async function openMetadata(layerId) {
    const resp = await fetch(`/api/layer/metadata/${layerId}`);
    const data = await resp.json();
    const body = document.getElementById('metadata-body');
    body.innerHTML = `
      <div><strong>Nome:</strong> ${data.name || '-'}</div>
      <div><strong>Produtor:</strong> ${data.producer || '-'}</div>
      <div><strong>Data:</strong> ${data.date || '-'}</div>
      <div><strong>Responsável:</strong> ${data.responsible || '-'}</div>
      <div><strong>CRS:</strong> ${data.crs || '-'}</div>`;
    new bootstrap.Modal(document.getElementById('metadataModal')).show();
  }

  async function openAttributeTable(layerMeta) {
    const opts = {};
    if (extentOnlyCheckbox.checked) {
      const b = map.getBounds();
      opts.bbox = `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
    }
    if (aoiLayer) opts.clipGeometry = aoiLayer.toGeoJSON().geometry;
    const gj = await fetchLayerGeoJSON(layerMeta, opts);
    const features = (gj && gj.features) ? gj.features : [];
    const table = document.getElementById('attr-table');
    const thead = table.querySelector('thead'); const tbody = table.querySelector('tbody');
    thead.innerHTML = ''; tbody.innerHTML = '';
    if (!features.length) {
      thead.innerHTML = '<tr><th>Nenhum registro</th></tr>';
    } else {
      const cols = Object.keys(features[0].properties || {});
      const trh = document.createElement('tr');
      cols.forEach(c => { const th = document.createElement('th'); th.textContent = c; th.style.cursor='pointer'; th.addEventListener('click',()=>sortTableBy(c)); trh.appendChild(th); });
      thead.appendChild(trh);
      features.forEach(f => {
        const tr = document.createElement('tr');
        cols.forEach(c => { const td = document.createElement('td'); td.textContent = f.properties[c]; tr.appendChild(td); });
        tbody.appendChild(tr);
      });
      document.getElementById('attr-filter').oninput = function() {
        const q = this.value.toLowerCase();
        Array.from(tbody.rows).forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
      };
      function sortTableBy(col) {
        const idx = cols.indexOf(col);
        const rows = Array.from(tbody.rows);
        const asc = table.getAttribute('data-sort') !== `${col}:asc`;
        rows.sort((a,b)=>{
          const va = a.cells[idx].textContent; const vb = b.cells[idx].textContent;
          if (!isNaN(va) && !isNaN(vb)) return asc ? (va-vb) : (vb-va);
          return asc ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        tbody.innerHTML=''; rows.forEach(r=>tbody.appendChild(r));
        table.setAttribute('data-sort', `${col}:${asc?'asc':'desc'}`);
      }
    }
    new bootstrap.Modal(document.getElementById('attributesModal')).show();
  }

  map.on('click', async (e) => {
    const activeIds = Object.keys(activeLayerIdToLeafletLayer).map(Number);
    if (!activeIds.length) return;
    const bbox = bboxQueryAroundPoint(e.latlng);
    const results = [];
    for (const id of activeIds) {
      const meta = allLayers.find(l => l.id === id);
      if (!meta) continue;
      const gj = await fetchLayerGeoJSON(meta, {bbox, clipGeometry: aoiLayer ? aoiLayer.toGeoJSON().geometry : null});
      if (gj && gj.features && gj.features.length) {
        const f = gj.features[0];
        results.push({layer: meta.name, props: f.properties});
      }
    }
    if (results.length) {
      const html = results.map(r => `<div class='mb-2'><div class='fw-bold small'>${r.layer}</div><pre class='small mb-0'>${JSON.stringify(r.props, null, 2)}</pre></div>`).join('');
      L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
    }
  });

  async function loadLayers() {
    const resp = await fetch(`/portal/${companySlug}/api/camadas`);
    const data = await resp.json();
    allLayers = Object.values(data).flat().map(l => ({...l, symbology: l.symbology || null}));
    renderLayersPanel(data);
    
    // Carregar estado dos rótulos
    const savedLabels = JSON.parse(localStorage.getItem(stateKey('layerLabels')) || '{}');
    Object.assign(layerLabelsState, savedLabels);
    
    // Aplicar estado visual dos botões de rótulos
    Object.keys(layerLabelsState).forEach(layerId => {
      if (layerLabelsState[layerId]) {
        const btnLabels = document.querySelector(`#layer-${layerId}`)?.closest('.list-group-item')?.querySelector('button[title="Alternar rótulos"]');
        if (btnLabels) {
          btnLabels.classList.remove('btn-outline-secondary');
          btnLabels.classList.add('btn-success');
        }
      }
    });
    
    const saved = JSON.parse(localStorage.getItem(stateKey('activeLayers')) || '[]');
    saved.forEach(id => { const cb = document.getElementById(`layer-${id}`); if (cb) cb.checked = true; });
    const extentOnly = JSON.parse(localStorage.getItem(stateKey('extentOnly')) || 'false');
    extentOnlyCheckbox.checked = extentOnly;
    const savedAoi = JSON.parse(localStorage.getItem(stateKey('aoi')) || 'null');
    if (savedAoi) { aoiLayer = L.geoJSON(savedAoi, {style:{color:'#ff6600'}}).addTo(map); btnBuffer.disabled = false; btnClearAoi.disabled = false; }
    for (const id of saved) {
      const meta = allLayers.find(l => l.id === id);
      if (meta) await addLayerToMap(meta);
    }
    updateLegend();
  }

  // Eventos simples
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    Array.from(layersPanel.querySelectorAll('.list-group-item')).forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
  basemapSelect.addEventListener('change', (e) => setBasemap(e.target.value));
  extentOnlyCheckbox.addEventListener('change', () => { persistState(); updateActiveLayers(); });
  map.on('moveend', () => { if (extentOnlyCheckbox.checked) updateActiveLayers(); });

  loadLayers();
})();

  // Estado dos rótulos por camada
  const layerLabelsState = {};
  
  function toggleLayerLabels(layerId) {
    const currentState = layerLabelsState[layerId] || false;
    layerLabelsState[layerId] = !currentState;
    
    // Salvar estado no localStorage
    localStorage.setItem(stateKey('layerLabels'), JSON.stringify(layerLabelsState));
    
    // Atualizar visual do botão
    const btnLabels = document.querySelector(`#layer-${layerId}`).closest('.list-group-item').querySelector('button[title="Alternar rótulos"]');
    if (layerLabelsState[layerId]) {
      btnLabels.classList.remove('btn-outline-secondary');
      btnLabels.classList.add('btn-success');
      btnLabels.innerHTML = '🏷️';
    } else {
      btnLabels.classList.remove('btn-success');
      btnLabels.classList.add('btn-outline-secondary');
      btnLabels.innerHTML = '🏷️';
    }
    
    // Re-aplicar rótulos se a camada estiver ativa
    if (activeLayerIdToLeafletLayer[layerId]) {
      applyLabelsToLayer(layerId);
    }
  }
  
  function applyLabelsToLayer(layerId) {
    const layer = activeLayerIdToLeafletLayer[layerId];
    const layerMeta = allLayers.find(l => l.id === layerId);
    
    if (!layer || !layerMeta) return;
    
    // Remover rótulos existentes
    if (layer._labelLayer) {
      map.removeLayer(layer._labelLayer);
      layer._labelLayer = null;
    }
    
    // Se rótulos estão desabilitados, não fazer nada
    if (!layerLabelsState[layerId]) return;
    
    // Verificar se a camada tem configurações de rótulos
    if (!layerMeta.labels || !layerMeta.labels.field) return;
    
    const labelConfig = layerMeta.labels;
    const labelLayer = L.layerGroup();
    labelLayer._labelLayer = true;
    
    // Aplicar rótulos a cada feature
    layer.eachLayer(featureLayer => {
      if (featureLayer.feature && featureLayer.feature.properties) {
        const labelText = featureLayer.feature.properties[labelConfig.field];
        if (!labelText) return;
        
        // Calcular posição do rótulo
        let labelPosition;
        if (featureLayer.feature.geometry.type === 'Point') {
          labelPosition = featureLayer.getLatLng();
        } else if (featureLayer.feature.geometry.type === 'LineString') {
          // Posição no meio da linha
          const bounds = featureLayer.getBounds();
          labelPosition = bounds.getCenter();
        } else if (featureLayer.feature.geometry.type === 'Polygon') {
          // Centro do polígono
          const bounds = featureLayer.getBounds();
          labelPosition = bounds.getCenter();
        }
        
        if (labelPosition) {
          // Criar elemento HTML para o rótulo
          const labelDiv = document.createElement('div');
          labelDiv.innerHTML = labelText;
          labelDiv.style.cssText = `
            font-family: ${labelConfig.font || 'Arial'}, sans-serif;
            font-size: ${labelConfig.size || 12}px;
            color: ${labelConfig.color || '#000000'};
            font-weight: ${labelConfig.bold ? 'bold' : 'normal'};
            font-style: ${labelConfig.italic ? 'italic' : 'normal'};
            text-shadow: 
              -1px -1px ${labelConfig.bufferSize || 2}px ${labelConfig.bufferColor || '#ffffff'},
              -1px 1px ${labelConfig.bufferSize || 2}px ${labelConfig.bufferColor || '#ffffff'},
              1px -1px ${labelConfig.bufferSize || 2}px ${labelConfig.bufferColor || '#ffffff'},
              1px 1px ${labelConfig.bufferSize || 2}px ${labelConfig.bufferColor || '#ffffff'};
            white-space: nowrap;
            pointer-events: none;
            z-index: 1000;
            text-align: center;
          `;
          
          // Criar marcador de rótulo
          const labelMarker = L.marker(labelPosition, {
            icon: L.divIcon({
              html: labelDiv,
              className: 'label-icon',
              iconSize: [labelDiv.offsetWidth, labelDiv.offsetHeight],
              iconAnchor: [labelDiv.offsetWidth / 2, labelDiv.offsetHeight / 2]
            })
          });
          
          // Aplicar deslocamento
          if (labelConfig.offsetX || labelConfig.offsetY) {
            const offsetLat = labelPosition.lat + ((labelConfig.offsetY || 0) / 1000);
            const offsetLng = labelPosition.lng + ((labelConfig.offsetX || 0) / 1000);
            labelMarker.setLatLng([offsetLat, offsetLng]);
          }
          
          labelLayer.addLayer(labelMarker);
        }
      }
    });
    
    labelLayer.addTo(map);
    layer._labelLayer = labelLayer;
  }


