const cardsElement = document.getElementById("cards");
const cardElement = document.getElementsByClassName("card");
const overlay = document.getElementById("overlay");
const background = document.getElementById("background");
const cardModal = document.getElementsByClassName("card-modal-container")[0];
const bgModal = document.getElementsByClassName("bg-modal-container")[0];
const folderModal = document.getElementsByClassName("folder-modal-container")[0];
const importExportModal = document.getElementsByClassName("import-export-modal-container")[0];
const importExportButton = document.getElementById("import-export-button")
const exportButton = document.getElementById("export-button");
const exportFile = document.getElementById("export-file-name");
const importInput = document.getElementById("import-input");
const importArea = document.getElementsByClassName("import-input-area")[0];
const fileName = document.getElementsByClassName("file-name")[0];
const folderTitle = document.getElementsByClassName("folder-title")[0]
const folderContent = document.getElementById("folder-content");
const bgInput = document.getElementById("bg-input");
const titleElement = document.getElementById("title");
const urlElement = document.getElementById("url");
const removeBtn = document.getElementsByClassName("remove");
const editBtn = document.getElementsByClassName("edit");
const addFolder = document.getElementById("addFolder");
const doneBtn = document.getElementById("doneBtn");
const customizeTabsBtn = document.getElementById("customizeTabsBtn");
const backgroundBtn = document.getElementById("backgroundBtn");
const importBtns = document.querySelector('.sections > .icons-wrap')
const cancelBgChangeBtn = document.querySelector("#bg-modal > .icons-wrap > #close");
const successBgChangeBtn = document.querySelector("#bg-modal > .icons-wrap > #success");
const cancelConfigModalBtn = document.querySelector(".sections > .icons-wrap > #close");
const successConfigModalBtn = document.querySelector(".sections > .icons-wrap > #success");
const notification = document.getElementById('notification');

let cardList = [];
let flag;
let imgPreview;
let timeout;
let configData;
let saveFolderPosition;

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    resetModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (!cardModal.classList.contains("hide")) {
    if (e.code === "Enter") {
      doneAction();
    }
  }
});

overlay.addEventListener("click", () => {
  resetModal()
})

importArea.addEventListener('dragover', function (e) {
  e.preventDefault();
  importArea.classList.add('drag-over');
});

importArea.addEventListener('drop', function (e) {
  e.preventDefault();
  importArea.classList.remove('drag-over');

  var files = e.dataTransfer.files;

  extractDataFromFile(files[0])
});

importArea.addEventListener('dragleave', function () {
  importArea.classList.remove('drag-over');
});

Array.from([cardModal, folderModal, importExportModal, bgModal]).forEach(modal => modal.addEventListener("click", (e) => {
  e.stopPropagation()
}))

doneBtn.addEventListener("click", async () => {
  doneAction();
});

cancelBgChangeBtn.addEventListener("click", () => {
  renderBackground()
  resetModal();
});

successBgChangeBtn.addEventListener("click", () => {
  updateLocalStorage("background", imgPreview);
  resetModal();
});

cancelConfigModalBtn.addEventListener("click", () => {
  importArea.classList.remove('hide')
  importBtns.classList.add('hide')

  fileName.innerText = "";
  configData = null;
});

successConfigModalBtn.addEventListener("click", async () => {
  if (configData) {
    validateDataFromFile(configData);
  } else {
    console.log('Some of the data is not valid!')
  }
  resetModal();
});

folderTitle.addEventListener('blur', () => {
  if (saveFolderPosition) {
    const updatedCards = cardList.map(card => {
      if (card.position === Number(saveFolderPosition) && card.type === 'folder') {
        return {
          ...card,
          name: folderTitle.value,
        }
      } else {
        return card
      }
    })

    updateLocalStorage("cards", updatedCards)
    renderCards(updatedCards)
  }
})

const downloadFile = () => {
  const background = fetchData('background')
  const cards = fetchData('cards')

  const fileName = `${exportFile.value.trim().length ? exportFile.value.replaceAll('.', "") : 'config'}.json`;
  const object = {};
  if (background) {
    object['background'] = background;
  }
  if (cards) {
    object['cards'] = cards;
  }

  const jsonString = JSON.stringify(object, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" })

  const blobUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.style.display = "none";
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;

  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  resetModal();
}

exportButton.addEventListener('click', downloadFile)

bgInput.addEventListener("change", (e) => {
  if (e.target.files[0].size >= 3000000) {
    alert("image file size is too big, it will NOT be saved!");
    return;
  } else {
    convertImgToBase64(e.target.files[0]).then((image) => {
      imgPreview = image;
    });
  }
});

importInput.addEventListener('change', (e) => {
  notification.innerText = ""
  const file = e.target.files[0];

  extractDataFromFile(file)
})

backgroundBtn.addEventListener("click", (e) => {
  bgModal.classList.toggle("hide");
  overlay.classList.remove("hide");
  importExportModal.classList.add("hide");
  cardModal.classList.add("hide");
  folderModal.classList.add("hide");
});

importExportButton.addEventListener("click", (e) => {
  importExportModal.classList.toggle("hide");
  overlay.classList.remove("hide");
  cardModal.classList.add("hide");
  bgModal.classList.add("hide");
  folderModal.classList.add("hide");
  notification.innerText = '';
});

folderContent.addEventListener("dragstart", (e) => {
  e.stopPropagation()
  e.dataTransfer.setData("src", e.target.getAttribute("position"));
});

folderContent.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
});

folderContent.addEventListener('drop', async (e) => {
  e.stopPropagation()

  const targetPos = Number(saveFolderPosition)
  const foundFolder = cardList.find(card => card.position === targetPos)

  const updatedList = await dropEvent(e, foundFolder.cards, folderContent)

  const updatedCards = cardList.map(card => {
    if (card.position === targetPos) {
      return {
        ...card,
        cards: updatedList
      }
    }
    return card
  })

  updateLocalStorage("cards", updatedCards)
  renderCards(updatedCards)
})

addFolder.addEventListener('click', () => {
  if (cardList.length >= 20 && Array.from(cardsElement.children).length >= 20) {
    console.log('cards capacity is full')
    return;
  } else {
    const result = createFolder(null);
    (result) ? cardList.push({ type: 'folder', name: 'folder', cards: [], position: cardList.length }) : "";
    updateLocalStorage("cards", cardList)
  }
})

cardsElement.addEventListener("dragstart", (e) => {
  e.dataTransfer.setData("src", e.target.getAttribute("position"));
});

cardsElement.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
});

cardsElement.addEventListener("drop", (e) => {
  e.preventDefault()
  e.stopPropagation()
  const updatedList = dropEvent(e, cardList, cardsElement)
  if (!updatedList) {
    return;
  }
  updateLocalStorage("cards", updatedList);
  renderCards(updatedList)
})

const setData = ({ newTitle, newUrl, newLogo = null, newColor = null, newPosition = null, inFolder = false }) => {
  if (!newTitle || !newUrl) {
    console.log('no title or url')
    return;
  }

  if (cardList === null) {
    cardList = fetchData("cards");
  }

  switch (flag[0]) {
    case "newCard":
      cardList.push({
        title: newTitle,
        url: newUrl,
        logo: newLogo,
        color: newColor,
        position: newPosition ? newPosition : cardList ? cardList.length : 0,
      });
      break;

    case "editCard":
      const folderElement = flag[1]?.parentNode
      if (folderElement?.getAttribute('id', 'folder-content')) {
        cardList = cardList.map((card) => {
          if (card.position === Number(saveFolderPosition)) {
            const updatedCards = card.cards.map(({ title, url, logo, color, position }) => {
              if (Number(flag[1].getAttribute('position')) === position) {

                return {
                  title: newTitle || title,
                  url: newUrl || url,
                  logo: newLogo || logo,
                  color: newColor || color,
                  position: newPosition || position,
                };
              }
              return card
            })
            return {
              ...card,
              cards: updatedCards
            };
          }
          return card
        });
      } else {
        cardList = cardList.map(({ title, url, logo, color, position }, idx) => {
          if (cardsElement.children[idx] === flag[1]) {
            return {
              title: newTitle || title,
              url: newUrl || url,
              logo,
              color,
              position: newPosition || position,
            };
          } else {
            return {
              title,
              url,
              logo,
              color,
              position,
            };
          }
        });
      }
      break;
  }

  updateLocalStorage("cards", cardList);
};

const doneAction = () => {
  setData({ newTitle: titleElement.value, newUrl: urlElement.value });
  flag[1].querySelector(".bottom-title").innerHTML = titleElement.value;
  flag[1].href = urlElement.value;

  resetModal();
};

const resetModal = () => {
  folderTitle.value = "";
  folderContent.replaceChildren();
  overlay.classList.add("hide");
  folderModal.classList.add('hide')
  bgInput.value = "";
  titleElement.value = "";
  urlElement.value = "";
  importInput.value = "";
  fileName.innerHTML = "";
  notification.innerHTML = "";
  exportFile.value = "";
  bgModal.classList.add("hide");
  importExportModal.classList.add("hide");
  importArea.classList.remove("hide");
  importBtns.classList.add("hide");
  cardModal.classList.add("hide");
  imgPreview = null;
  flag = null;
  saveFolderPosition = null;
};

document.addEventListener("DOMContentLoaded", () => {
  makeTextInputUndroppable()
  renderBackground();
  renderCards();
});
