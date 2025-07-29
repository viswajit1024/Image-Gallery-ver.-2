document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const urlInput = document.getElementById('url');
  const altInput = document.getElementById('alt');
  const gallery = document.getElementById('gallery');
  const dropContainer = document.getElementById('dropContainer');
  const fileInput = document.getElementById('fileInput');

  const editDialog = document.getElementById('editDialog');
  const editForm = document.getElementById('editForm');
  const editUrl = document.getElementById('editUrl');
  const editAlt = document.getElementById('editAlt');

  let images = JSON.parse(localStorage.getItem('images') || '[]');
  let editingIndex = null;

  const save = () => localStorage.setItem('images', JSON.stringify(images));

  function validateImageURL(url) {
    return /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  }

  function preloadImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function addImageObj(imgObj) {
    let ok = imgObj.dataURL
      ? true
      : validateImageURL(imgObj.url) && await preloadImage(imgObj.url);
    if (!ok) {
      imgObj.error = true;
    }
    images.push(imgObj);
    save();
    render();
  }

  function render() {
    gallery.innerHTML = '';
    images.slice().reverse().forEach((img, idxRev) => {
      const idx = images.length - 1 - idxRev;
      const item = document.createElement('div');
      item.className = 'image-item';

      if (img.error) {
        const fallback = document.createElement('div');
        fallback.className = 'fallback';
        fallback.textContent = '❌ Failed to load';
        item.appendChild(fallback);
      } else {
        const imgEl = document.createElement('img');
        imgEl.src = img.dataURL || img.url;
        imgEl.alt = img.alt || '';
        imgEl.onerror = () => {
          img.error = true;
          save();
          render();
        };
        item.appendChild(imgEl);
      }

      const ctrl = document.createElement('div'); ctrl.className = 'controls';
      const del = document.createElement('button');
      del.textContent = 'Delete'; del.onclick = () => {
        images.splice(idx, 1); save(); render();
      };
      const edit = document.createElement('button');
      edit.textContent = 'Edit'; edit.onclick = () => openEdit(idx);
      ctrl.append(del, edit);
      item.appendChild(ctrl);
      gallery.appendChild(item);
    });
  }

  function openEdit(idx) {
    editingIndex = idx;
    const img = images[idx];
    editUrl.value = img.url || '';
    editAlt.value = img.alt || '';
    editDialog.showModal();
  }

  editForm.addEventListener('submit', e => {
    e.preventDefault();
    if (editingIndex != null) {
      const img = images[editingIndex];
      img.url = editUrl.value;
      img.alt = editAlt.value;
      img.dataURL = null; img.error = false;
      save();
      addImageObj(img);
      editingIndex = null;
    }
    editDialog.close();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    addImageObj({ url: urlInput.value.trim(), alt: altInput.value.trim(), dataURL: null });
    urlInput.value = ''; altInput.value = '';
  });

  dropContainer.addEventListener('dragover', e => {
    e.preventDefault(); dropContainer.classList.add('hover');
  });
  dropContainer.addEventListener('dragleave', e => {
    e.preventDefault(); dropContainer.classList.remove('hover');
  });
  dropContainer.addEventListener('drop', e => {
    e.preventDefault(); dropContainer.classList.remove('hover');
    handleFiles(e.dataTransfer.files);
  });
  dropContainer.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files) {
    [...files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => addImageObj({ dataURL: reader.result, alt: file.name });
      reader.readAsDataURL(file);
    });
  }

  render();
});
