const fetchData = (type) => {
  return JSON.parse(localStorage.getItem(type));
};

const updateLocalStorage = (type, items) => {
  localStorage.setItem(type, JSON.stringify(items));
};

const renderBackground = (bg) => {
  const savedBg = bg ?? fetchData("background");
  if (savedBg) {
    background.style.backgroundImage = `url(` + savedBg + `)`;
  }
}

const getCards = () => {
  const cards = document.getElementById('cards')
  return Array.from(cards.children)
}

const renderCards = async (cards) => {
  if (cardsElement.children.length) {
    cardsElement.replaceChildren()
  }
  cardList = cards ?? fetchData("cards");

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
          const card = createCard(cardList[j]);
          cardsElement.append(card);

          break;
        }
      }
    }
  }
};

const createCard = ({ title, url, logo = null, color, position = null }) => {
  const card = document.createElement("a");
  const buttonsDiv = document.createElement("div");
  const imgDiv = document.createElement("div");
  const img = document.createElement("img");
  const removeButton = document.createElement("i");
  const editButton = document.createElement("i");
  const span = document.createElement("span");

  card.classList.add("card");
  card.style.backgroundColor = color;
  span.innerHTML = title;
  card.setAttribute(
    "position",
    position === null ? cardsElement.length : position
  );
  card.setAttribute("href", url);
  card.setAttribute("draggable", true);
  img.src = logo;
  img.width = 40;
  imgDiv.classList.add("logo");
  span.classList.add("bottom-title");

  [buttonsDiv, imgDiv, img, removeButton, editButton, span].forEach((element) => {
    element.setAttribute("draggable", false);
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  buttonsDiv.classList.add("button-group");
  removeButton.classList.add("fas", "fa-times", "remove");
  editButton.classList.add("fas", "fa-edit", "edit");

  removeButton.addEventListener("click", removeEvent);
  editButton.addEventListener("click", editEvent);

  imgDiv.append(img);
  imgDiv.append(span);
  buttonsDiv.append(editButton);
  buttonsDiv.append(removeButton);
  card.append(imgDiv);
  card.append(buttonsDiv);
  return card;
};

const openFolder = (e) => {
  overlay.classList.remove('hide')
  const target = getFolder(e.target)
  const targetPos = target.getAttribute('position')
  savedFolderPosition = targetPos
  const foundFolder = cardList.find(card => card.position === Number(targetPos))

  folderTitle.value = foundFolder.name;
  foundFolder?.cards.forEach(card => {
    const newCard = createCard(card)
    folderContent.append(newCard)
  })

  folderModal.classList.remove('hide')
}

const removeFolderAndUpdate = (folderToRemove, folderPos) => {
  folderToRemove.remove()
  const updatedCards = cardList.filter(card => card.position !== Number(folderPos) ? card : "")
  const repositionedCards = repositionCards(updatedCards)

  updateLocalStorage("cards", repositionedCards);
  renderCards(repositionedCards)
}

const createFolder = (data = null) => {
  if (data?.position >= 20 || (cardList.length >= 20 && Array.from(cardsElement.children).length >= 20)) {
    console.log('cards capacity is full')
    return null;
  }
  const position = data?.position ?? cardList.length

  const folder = document.createElement('div');
  const folderWrapper = document.createElement('div')
  const buttonsDiv = document.createElement("div");
  const removeButton = document.createElement("i");

  folder.classList.add('folder-preview');
  folderWrapper.classList.add('folder-wrapper');
  folder.setAttribute('position', position)
  folder.setAttribute('draggable', true)

  const folderPreviewTitle = document.createElement('div');
  folderPreviewTitle.innerHTML = data?.name || "folder"
  folderPreviewTitle.classList.add('folder-preview-title');
  folderPreviewTitle.setAttribute('draggable', false)
  folderWrapper.appendChild(folderPreviewTitle)

  Array.from([buttonsDiv, removeButton]).forEach((element) => {
    element.setAttribute("draggable", false);
    element.addEventListener("dragstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  buttonsDiv.classList.add("button-group");
  removeButton.classList.add("fas", "fa-times", "remove");

  removeButton.addEventListener('click', (e) => {
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

  buttonsDiv.appendChild(removeButton);


  const container = document.createElement('div');
  container.classList.add('folder-container')

  if (data?.cards?.length) {
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
  folder.appendChild(buttonsDiv)

  cardsElement.appendChild(folder);
  return (!data) ? true : false;
}

const extractDataFromFile = (file) => {
  clearTimeout(timeout)
  if (file.size * 2 >= 4000000) {
    notification.innerText = "image file size is too big, it will NOT be saved!";
    return;
  } else if (file.type !== 'application/json' || file.name.split('.').at(-1) !== 'json') {
    notification.innerText = 'not valid file type';
  } else {
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target.result;
      const fileContentJson = JSON.parse(fileContent)

      if (Object.keys(fileContentJson).includes('background') || Object.keys(fileContentJson).includes('cards')) {
        importArea.classList.add('hide')
        importModalButtons.classList.remove('hide')

        importFileName.innerText = file.name;
        configData = fileContentJson;
      } else {
        notification.innerText = 'not allowed content!'
      }
    }
    reader.readAsText(file)
  }
  timeout = setTimeout(() => {
    notification.innerText = ""
  }, 5000);
}

const validateDataFromFile = (data) => {
  const promises = [...validData(data)].every(value => value)

  if (promises) {
    updateLocalStorage("cards", data?.cards)
    updateLocalStorage("background", data?.background)
    renderCards(data?.cards)
    renderBackground(data?.background)
  } else {
    console.log('Something went wrong with the data provided!')
  }
}

const getFolder = (target) => {
  return target.classList.contains('folder-preview') ?
    target :
    target.parentNode.classList.contains('folder-preview') ?
      target.parentNode :
      target.parentNode.parentNode;
}

const folderDropEvent = (e, container = null) => {
  e.preventDefault()

  if (!container) {
    container = (e.target.classList.contains('folder-container')) ? e.target : Array.from(e.target.children)[1]
  }

  if (Array.from(container.children).length === 8) {
    console.log('folder capactiy is maxed')
    return;
  }

  let target = getFolder(e.target)

  let srcPos = e.dataTransfer.getData("src");
  let targetPos = target.getAttribute("position");

  if (srcPos !== targetPos) {
    const cardsElement = document.getElementById("cards")
    let src = cardsElement.children[srcPos];

    if (src.classList.contains('folder-preview')) {
      swapElementSpots(src, target, cardsElement);

      cardList = swapCardsData(srcPos, targetPos, cardList)
      repositionElements()
    } else {
      const child = cardsElement.removeChild(src);
      child.classList.remove('card')
      child.removeAttribute('position')

      const itemPreview = document.createElement('div');
      itemPreview.style.pointerEvents = "none"

      const logoDiv = Array.from(child.children)[0]
      const logo = Array.from(logoDiv.children)[0]
      logo.style.pointerEvents = 'none'

      const items = [itemPreview, logo]
      items.forEach(element => element.setAttribute('draggable', false))

      itemPreview.appendChild(logo)
      container.appendChild(itemPreview)

      getCards().forEach((element, idx) => {
        element.setAttribute('position', idx)
      })

      const foundCard = cardList.find(card => card.position === Number(srcPos))
      const foundFolder = cardList.find(card => card.position === Number(targetPos) && card.type === 'folder')

      if (!foundCard || !foundFolder) {
        return;
      }
      foundFolder.cards.push({ ...foundCard, position: foundFolder.cards.length })
      cardList = cardList.filter(card => card.position !== Number(srcPos))

      cardList = cardList.map((card, i) => {
        return {
          ...card,
          position: i
        }
      })
    }

    updateLocalStorage("cards", cardList);
  }
}

const dropFromFolderEvent = e => {
  if (e.target.classList.contains('overlay')) {
    const srcPos = Number(e.dataTransfer.getData("src"));
    if (cardList.length === 20 && cardsElement.children.length === 20) {
      console.log("no space to drop")
      return;
    } else if (cardList.length > 20 || cardsElement.children.length > 20) {
      console.log("something went wrong")
      return;
    }

    const foundCard = cardList[savedFolderPosition].cards.find(card => card.position === srcPos)
    const elementToTransfer = folderContent.removeChild(folderContent.children[srcPos])
    elementToTransfer.setAttribute("position", cardList.length)
    cardList.push(foundCard);

    const updatedCardsList = cardList.map((card) => {
      if (card.type === 'folder' && card.position === Number(savedFolderPosition)) {
        return {
          ...card,
          cards: repositionCards(card.cards.filter(card => card.position !== srcPos))
        }
      } else {
        return card
      }
    })
    const repositionedCards = repositionCards(updatedCardsList)
    cardsElement.appendChild(elementToTransfer);

    resetModal()

    updateLocalStorage("cards", repositionedCards);
    renderCards(repositionedCards)
  }
}

const dropEvent = (e, list, cardsElement) => {
  e.preventDefault();

  let target = e.target;
  if (!cardsElement.children.length) {
    return;
  }

  if (!target.classList.contains('card') && !target.classList.contains('folder-preview')) {
    return;
  }

  let srcPos = Number(e.dataTransfer.getData("src"));
  let targetPos = Number(target.getAttribute("position"));

  if (srcPos !== targetPos) {
    let src = cardsElement.childNodes[srcPos];
    swapElementSpots({ src, target, cardsElement, list });

    const buttons = target.querySelector('.button-group');
    const removeButton = target.querySelector('.remove');
    const editButton = target.querySelector('.edit');
    const buttonsList = [buttons, removeButton, editButton]
    buttonsList.forEach((element) => (element.style.pointerEvents = "auto"));
    repositionElements();

    const updatedList = swapCardsData(srcPos, targetPos, list)
    return updatedList;
  }
  return list;
}

const swapElementSpots = ({ src, target, cardsElement, list = null }) => {
  const srcChild = src.cloneNode(true);
  const targetChild = target.cloneNode(true);

  const replacelist = [srcChild, targetChild];
  replacelist.forEach(elem => {
    elem.addEventListener('drop',
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (elem.classList.contains('folder-preview')) {
          folderDropEvent(e)
        } else {
          dropEvent(e, list, cardsElement)
        }
      })
  })

  cardsElement.replaceChild(srcChild, target);
  cardsElement.replaceChild(targetChild, src);
}

const swapCardsData = (srcPos, targetPos, list) => {
  const foundSrcCard = list.find(card => card.position === Number(srcPos))
  const foundtargetCard = list.find(card => card.position === Number(targetPos))

  list = list.filter(card => card.position !== Number(srcPos) && card.position !== Number(targetPos))
  list.push({ ...foundSrcCard, position: foundtargetCard.position })
  list.push({ ...foundtargetCard, position: foundSrcCard.position })
  return sortCards(list)
}

const sortCards = (list) => {
  return list.sort((cardA, cardB) => {
    if (cardA.position < cardB.position) {
      return -1;
    } else if (cardA.position > cardB.position) {
      return 1;
    }
    return 0;
  });
}

const repositionCards = (list) => {
  return list.map((card, i) => {
    if (card.type === 'folder') {
      const cards = card.cards?.map((fcard, j) => ({ ...fcard, position: j }))
      return {
        ...card,
        cards: cards || [],
        position: i,
      }
    } else {
      return { ...card, position: i }
    }
  })
}

const repositionElements = () => Array.from(cardsElement.children).forEach((elem, i) => elem.setAttribute('position', i))

const removeEvent = (e) => {
  e.preventDefault();

  const element = e.target.parentNode.parentNode;
  const elementPos = Number(element.getAttribute('position'))
  const isParentFolder = element.parentNode.getAttribute('id')

  let updatedCards = cardList.map((card) => {
    if (card.position === Number(savedFolderPosition) && card.type === 'folder') {
      const cards = card.cards.filter(fcard => (fcard.position !== elementPos) ? card : "")

      return {
        ...card,
        cards
      }
    } else {
      return card
    }
  })

  if (isParentFolder !== 'folder-content') {
    updatedCards = updatedCards.filter(card => (card.position !== elementPos) ? card : "");
  }

  element.remove();

  Array.from(cardsElement.children).forEach((element, i) => {
    element.setAttribute("position", i);
  })

  const repositionedCards = repositionCards(updatedCards)

  updateLocalStorage("cards", repositionedCards);
  renderCards(repositionedCards)
}

const editEvent = (e) => {
  e.preventDefault();
  e.stopPropagation();

  let target = e.target.parentElement.parentElement;
  flag = ["editCard", target];
  overlay.classList.remove("hide");
  cardModal.classList.remove("hide");
  titleElement.value = target.querySelector(".bottom-title").innerHTML;
  urlElement.value = target.href;
}

const convertImgToBase64 = (image) => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      document.getElementById("background").style.backgroundImage =
        `url(` + reader.result + `)`;
      resolve(reader.result);
    });

    reader.readAsDataURL(image);
  });
};

const convertImgUrlToBase64 = (img, cb) => {
  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
    const reader = new FileReader();
    reader.onloadend = function () {
      cb(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", img);
  xhr.responseType = "blob";
  xhr.send();
};

const isValidUrl = (url) => {
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
}

const isValidDataUrl = (dataUrl) => {
  const dataUrlRegex = /^data:image\/([a-zA-Z]*);base64,([^\s]*)$/;
  return dataUrlRegex.test(dataUrl);
};

const isValidColorFormat = (color) => {
  const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  return hexColorRegex.test(color);
}

function validateCard(card) {
  if (card.type === "folder") {
    if (
      typeof card.name === "string" &&
      Array.isArray(card.cards) &&
      typeof card.position === "number" &&
      card.cards.every(validateCard)
    ) {
      return true;
    }
  } else {
    if (
      typeof card.title === "string" &&
      isValidUrl(card.url) &&
      isValidDataUrl(card.logo) &&
      typeof card.color === "string" &&
      isValidColorFormat(card.color) &&
      typeof card.position === "number"
    ) {
      return true;
    }
  }
  return false;
}

const validData = (config) => {
  const cardsPromise = new Promise((resolve) => {
    resolve(config?.cards.every(validateCard));
  })

  const backgroundPromise = new Promise((resolve) => {
    resolve(isValidDataUrl(config?.background));
  })

  return [cardsPromise, backgroundPromise]
}

const errorMsgManager = (flag) => {
  if (flag === "max") {
    return alert("you reached maximum card capacity!");
  } else {
    return alert("you do not meet the requirements!");
  }
};

const setData = ({ newTitle, newUrl, newLogo = null, newColor = null, newPosition = null }) => {
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
        position: cardList ? cardList.length : 0,
      });
      break;

    case "editCard":
      const folderElement = flag[1]?.parentNode;

      if (folderElement?.getAttribute('id') === 'folder-content') {
        cardList = cardList.map((card) => {
          if (card.type === 'folder' && card.position === Number(savedFolderPosition)) {
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
        cardList = cardList.map((element, idx) => {
          if (cardsElement.children[idx] === flag[1] && element.type !== 'folder') {
            const { title, url, logo, color, position } = element;
            return {
              title: newTitle || title,
              url: newUrl || url,
              logo,
              color,
              position: newPosition || position,
            };
          } else {
            return element;
          }
        });
      }
      break;
  }

  updateLocalStorage("cards", cardList);
};

const resetModal = () => {
  if (!folderModal.classList.contains('hide') && cardModal.classList.contains('hide')) {// if folder modal is open and card modal is closed.
    folderTitle.value = "";
    folderContent.replaceChildren();
    folderModal.classList.add('hide');
    overlay.classList.add("hide");
  } else if (!folderModal.classList.contains('hide')) {// if folder modal is open and card modal is open.
    titleElement.value = "";
    urlElement.value = "";
    cardModal.classList.add("hide");
  } else { // rest 
    titleElement.value = "";
    bgInput.value = "";
    urlElement.value = "";
    importInput.value = "";
    importFileName.innerHTML = "";
    bgFileName.innerHTML = "";
    notification.innerHTML = "";
    exportFileName.value = "";
    bgModal.classList.add("hide");
    bgArea.classList.remove('hide');
    backgroundModalButtons.classList.add('hide');
    importExportModal.classList.add("hide");
    importArea.classList.remove("hide");
    importModalButtons.classList.add("hide");
    cardModal.classList.add("hide");
    imgPreview = null;
    flag = null;
    savedFolderPosition = null;
    overlay.classList.add("hide");
  }
};

const makeTextInputUndroppable = () => {
  const textInputs = document.querySelectorAll('input[type=text]')

  Array.from(textInputs).forEach(elem => {
    elem.addEventListener('drop', (e) => e.preventDefault())
  })
}