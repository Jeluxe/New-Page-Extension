const fetchData = (type) => {
  return JSON.parse(localStorage.getItem(type));
};

const updateLocalStorage = (type, items) => {
  localStorage.setItem(type, JSON.stringify(items));
};

const getCards = () => {
  const cards = document.getElementById('cards')
  return Array.from(cards.children)
}

// const convertFavToBase64 = (url) => {
//     return new Promise((resolve) => {
//         let xhr = new XMLHttpRequest();
//         xhr.open('GET',
//             `https://s2.googleusercontent.com/s2/favicons?sz=32&domain_url=${url}`,
//             true);
//         xhr.responseType = "blob";
//         xhr.onload = function (e) { //Stringify blob...
//             //reload the icon from storage
//             let fr = new FileReader();
//             fr.onload =
//                 function (e) {
//                     resolve(e.target.result);
//                 }
//             fr.readAsDataURL(xhr.response);
//         }
//         xhr.send(null);
//     })
// }

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

    if (src.classList.contains('folder')) {
      console.log('cannot put folder inside folder!')
      return;
    }

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

    updateLocalStorage("cards", cardList);
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

    const btns = target.querySelector('.btn-group');
    const removeBtn = target.querySelector('.remove');
    const editBtn = target.querySelector('.edit');
    const btnsList = [btns, removeBtn, editBtn]

    btnsList.forEach((element) => (element.style.pointerEvents = "auto"));
    Array.from(cardsElement.children).forEach((elem, i) => elem.setAttribute('position', i))

    const foundSrcCard = list.find(card => card.position === Number(srcPos))
    const foundtargetCard = list.find(card => card.position === Number(targetPos))

    list = list.filter(card => card.position !== Number(srcPos) && card.position !== Number(targetPos))
    list.push({ ...foundSrcCard, position: foundtargetCard.position })
    list.push({ ...foundtargetCard, position: foundSrcCard.position })
    list = list.sort((cardA, cardB) => {
      if (cardA.position < cardB.position) {
        return -1;
      } else if (cardA.position > cardB.position) {
        return 1;
      }
      return 0;
    });
  }
  return list;
}

const removeEvent = (e) => {
  e.preventDefault();

  const element = e.target.parentNode.parentNode;
  const elementPos = Number(element.getAttribute('position'))

  const updatedCards = cardList.map((card) => {
    if (card.type !== 'folder') {
      return card
    } else {
      if (card.position === Number(saveFolderPosition)) {
        const cards = card.cards.filter(fcard => (fcard.position !== elementPos) ? card : "")

        return {
          ...card,
          cards
        }
      }
    }
  });

  element.remove();


  Array.from(cardsElement.children).forEach((element, i) => {
    element.setAttribute("position", i);
  })

  const sortedCards = updatedCards.map((card, i) => {
    if (card.type !== 'folder') {
      return {
        ...card,
        position: i
      }
    } else {
      const cards = card.cards.map((fcard, j) => {
        return {
          ...fcard,
          position: j
        }
      })
      return {
        ...card,
        cards
      }
    }
  })

  updateLocalStorage("cards", sortedCards);
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
