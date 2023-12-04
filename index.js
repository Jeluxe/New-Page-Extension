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

overlay.addEventListener("drop", (e) => {
  if (!folderModal.classList.contains('hide')) {
    console.log('first')
  }
})

Array.from([cardModal, folderModal, importExportModal, bgModal]).forEach(modal => modal.addEventListener("click", (e) => {
  e.stopPropagation()
}))

doneBtn.addEventListener("click", async () => {
  doneAction();
});

cancelBgChangeBtn.addEventListener("click", () => {
  background.style.backgroundImage =
    `url(` + fetchData("background") + `)`;
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

successConfigModalBtn.addEventListener("click", () => {
  if (configData) {
    updateLocalStorage("cards", configData?.cards)
    updateLocalStorage("background", configData?.background)
    render()
  }
  resetModal();
});

folderTitle.addEventListener('blur', () => {
  if (saveFolderPosition) {
    cardList = cardList.map(card => {
      if (card.position === Number(saveFolderPosition) && card.type === 'folder') {
        return {
          ...card,
          name: folderTitle.value,
        }
      } else {
        return card
      }
    })

    updateLocalStorage("cards", cardList)
    render()
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
  if (file.size * 2 >= 4000000) {
    alert("image file size is too big, it will NOT be saved!");
    return;
  } else if (file.type !== 'application/json' || file.name.split('.').at(-1) !== 'json') {
    alert('not json file');
  } else {
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const fileContentJson = JSON.parse(fileContent)

      if (Object.keys(fileContentJson).includes('background') || Object.keys(fileContentJson).includes('cards')) {
        importArea.classList.add('hide')
        importBtns.classList.remove('hide')

        fileName.innerText = file.name;
        configData = fileContentJson;
      } else {
        notification.innerText = 'not allowed content!'
      }
    }
    reader.readAsText(file)
  }
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

const openFolder = (e) => {
  overlay.classList.remove('hide')
  const target = getFolder(e.target)
  const targetPos = target.getAttribute('position')
  saveFolderPosition = targetPos
  const foundFolder = cardList.find(card => card.position === Number(targetPos))

  folderTitle.value = foundFolder.name;
  foundFolder?.cards.forEach(card => {
    const { title, url, logo, color, position } = card
    const newCard = createCard(title, url, logo, color, position)
    folderContent.append(newCard)
  })
  folderModal.classList.remove('hide')
}

const removeFolderAndUpdate = (folderToRemove, folderPos) => {
  folderToRemove.remove()
  const updatedCards = cardList.filter(card => card.position !== Number(folderPos) ? card : "")

  updateLocalStorage("cards", updatedCards);
}

const createFolder = (data = null) => {
  if (getCards().length === 20) {
    console.log('cards capacity is full')
    return;
  }
  const position = data?.position || cardList.length

  const folder = document.createElement('div');
  const folderWrapper = document.createElement('div')
  const btnsDiv = document.createElement("div");
  const removeBtn = document.createElement("i");

  folder.classList.add('folder-preview');
  folderWrapper.classList.add('folder-wrapper');
  folder.setAttribute('position', position)
  folder.setAttribute('draggable', true)

  const folderPreviewTitle = document.createElement('div');
  folderPreviewTitle.innerHTML = data?.name || "folder"
  folderPreviewTitle.classList.add('folder-preview-title');
  folderPreviewTitle.setAttribute('draggable', false)
  folderWrapper.appendChild(folderPreviewTitle)

  Array.from([btnsDiv, removeBtn]).forEach((element) => {
    element.setAttribute("draggable", false);
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  btnsDiv.classList.add("btn-group");
  removeBtn.classList.add("fas", "fa-times", "remove");

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    const folderToRemove = e.target.parentNode.parentNode;
    const folderPos = folderToRemove.getAttribute('position')

    if (folderToRemove.querySelector('.folder-container').children.length) {
      if (confirm('you have cards inside the folder, are you sure you want to delete the folder?')) {
        removeFolderAndUpdate(folderToRemove, folderPos)
      }
    } else {
      removeFolderAndUpdate(folderToRemove, folderPos)
    }
  })

  btnsDiv.appendChild(removeBtn);


  const container = document.createElement('div');
  container.classList.add('folder-container')

  if (data?.cards.length) {
    data.cards.forEach(card => {
      const logo = document.createElement("img");
      const itemPreview = document.createElement('div');

      logo.src = card.logo;
      logo.width = 40;

      logo.style.pointerEvents = "none";
      itemPreview.style.pointerEvents = "none"

      itemPreview.appendChild(logo)
      container.appendChild(itemPreview)
    })
  }

  folderWrapper.appendChild(container);

  folder.addEventListener('click', (e) => {
    e.stopPropagation()
    openFolder(e)
  })

  folder.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  folder.addEventListener('drop', (e) => {
    e.stopPropagation()

    folderDropEvent(e, container)
  })

  folder.appendChild(folderWrapper)
  folder.appendChild(btnsDiv)

  cardsElement.appendChild(folder);
}

folderContent.addEventListener("dragstart", (e) => {
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

  cardList = cardList.map(card => {
    if (card.position === targetPos) {
      return {
        ...card,
        cards: updatedList
      }
    }
    return card
  })

  updateLocalStorage("cards", cardList)
  render()
})

addFolder.addEventListener('click', () => {
  createFolder(null)
  cardList.push({ type: 'folder', name: 'folder', cards: [], position: cardList.length })
  updateLocalStorage("cards", cardList)
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
  render()
})

const createCard = (title, url, logo = null, color, position = null) => {
  const card = document.createElement("a");
  const btnsDiv = document.createElement("div");
  const imgDiv = document.createElement("div");
  const img = document.createElement("img");
  const removeBtn = document.createElement("i");
  const editBtn = document.createElement("i");
  const span = document.createElement("span");

  card.classList.add("card");
  card.style.backgroundColor = color;
  span.innerHTML = title;
  card.setAttribute(
    "position",
    position === null ? cardElement.length : position
  );
  card.setAttribute("href", url);
  card.setAttribute("draggable", true);
  img.src = logo;
  img.width = 40;
  imgDiv.classList.add("logo");
  span.classList.add("bottom-title");

  [btnsDiv, imgDiv, img, removeBtn, editBtn, span].forEach((element) => {
    element.setAttribute("draggable", false);
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  btnsDiv.classList.add("btn-group");
  removeBtn.classList.add("fas", "fa-times", "remove");
  editBtn.classList.add("fas", "fa-edit", "edit");

  removeBtn.addEventListener("click", removeEvent);
  editBtn.addEventListener("click", editEvent);

  imgDiv.append(img);
  imgDiv.append(span);
  btnsDiv.append(editBtn);
  btnsDiv.append(removeBtn);
  card.append(imgDiv);
  card.append(btnsDiv);
  return card;
};

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
};

const render = async () => {
  if (cardsElement.children.length) {
    cardsElement.replaceChildren()
  }
  cardList = fetchData("cards");

  if (cardList === null) {
    cardList = [];
  }
  for (let i = 0; i <= cardList.length && cardList.length <= 20; i++) {
    for (let j = 0; j < cardList.length && cardList.length < 21; j++) {
      if (j > cardList.length || i > cardList.length) {
        return;
      }

      if (cardList[j].position === i) {
        if (cardList[j].type === 'folder') {
          createFolder(cardList[j])

          break;
        } else {
          const { title, url, logo, color, position } = cardList[j];
          const card = createCard(title, url, logo, color, position);
          cardsElement.append(card);

          break;
        }
      }
    }
  }
};

const errorMsgManager = (flag) => {
  if (flag === "max") {
    return alert("you reached maximum card capacity!");
  } else {
    return alert("you do not meet the requirements!");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const savedBg = fetchData("background");
  render();

  if (savedBg) {
    background.style.backgroundImage = `url(` + savedBg + `)`;
  }
});
