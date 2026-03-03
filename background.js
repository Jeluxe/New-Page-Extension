let titleInput = document.getElementById("title-input");
let urlInput = document.getElementById("url-input");
let folderSelectionDropdown = document.getElementById("select-folder");
let button = document.getElementById("submit");
let exportBtn = document.getElementById("export");
let tempFavIconUrl;
let cardList;

const MAX_CARDS = 20;
const FOLDER_MAX_CARDS = 8;
const NEW_TAB_URL = "edge://newtab/";
const CARD_DEFAULT_COLOR = "rgba(58, 58, 58, 0.425)";

titleInput?.addEventListener("keyup", (e) => (titleInput.value = e.target.value));
urlInput?.addEventListener("keyup", (e) => (urlInput.value = e.target.value));
exportBtn?.addEventListener("click", () => downloadFile(true));

document.addEventListener("DOMContentLoaded", async () => {
  const { title, url, favIconUrl } = await getCurrentTab();

  titleInput.value = title;
  urlInput.value = url;
  cardList = fetchData("cards");
  createOptions(cardList)
  const newTabs = await getNewTab();

  button.addEventListener("click", async (e) => {
    if (cardList.length < MAX_CARDS || cardList[folderSelectionDropdown.value].cards.length < FOLDER_MAX_CARDS) {
      const convertedImg = await convertImgUrlToBase64(favIconUrl);
      await updateCards(titleInput.value, urlInput.value, convertedImg);
      if (newTabs && typeof newTabs === "object") {
        for (let i = 0; i < newTabs.length; i++) {
          await chrome.tabs.reload(newTabs[i].id);
        }
      }
      window.close();
    } else {
      alert("maxed capacity of cards");
    }
  });
});

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab.url === NEW_TAB_URL) {
    return { index: tab.index, title: "", url: "", favIconUrl: "" };
  }
  return tab;
}

async function getNewTab() {
  let queryOptions = { url: NEW_TAB_URL };
  let tabs = await chrome.tabs.query(queryOptions);
  return tabs;
}

const createOptions = (cardList) => {
  const filteredList = cardList.filter(card => card.type === "folder")

  for (let item of filteredList) {
    const newOption = createOption(item)
    folderSelectionDropdown.appendChild(newOption)
  }
}

const createOption = (item) => {
  const newOption = document.createElement("option")
  newOption.setAttribute("value", item.position);
  newOption.disabled = item.cards.length === FOLDER_MAX_CARDS;
  newOption.innerText = toCamelCase(item.name)
  return newOption
}

const updateCards = async (title, url, logo) => {
  const selectFolderPos = Number(folderSelectionDropdown.value)
  const newCardData = {
    title,
    url,
    logo,
    color: CARD_DEFAULT_COLOR,
    position: cardList.length ?
      selectFolderPos ?
        cardList[selectFolderPos].cards.length :
        cardList.length :
      0,
  }
  if (selectFolderPos) {
    cardList = cardList.map(card => {
      if (card.type === "folder" && card.position === selectFolderPos) {
        card.cards.push(newCardData)
        return {
          ...card,
          cards: card.cards
        }
      }
      return card
    })
  } else {
    cardList.push(newCardData);
  }

  localStorage.setItem("cards", JSON.stringify(cardList));
};