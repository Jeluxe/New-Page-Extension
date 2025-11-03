let titleInput = document.getElementById("title-input");
let urlInput = document.getElementById("url-input");
let folderSelectionDropdown = document.getElementById("select-folder");
let button = document.getElementById("submit");
let exportBtn = document.getElementById("export");
let tempFavIconUrl;
let cardList;

const maxCardsInList = 20;
const maxCardsInFolder = 8;
const newTabUrl = "edge://newtab/";
const cardDefaultColor = "rgba(58, 58, 58, 0.425)";

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
    if (cardList.length < maxCardsInList || cardList[folderSelectionDropdown.value].cards.length < maxCardsInFolder) {
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
  if (tab.url === newTabUrl) {
    return { index: tab.index, title: "", url: "", favIconUrl: "" };
  }
  return tab;
}

async function getNewTab() {
  let queryOptions = { url: newTabUrl };
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
  newOption.disabled = item.cards.length === maxCardsInFolder;
  newOption.innerText = toCamelCase(item.name)
  return newOption
}

const updateCards = async (title, url, logo) => {
  const selectFolderPos = Number(folderSelectionDropdown.value)
  const newCardData = {
    title,
    url,
    logo,
    color: cardDefaultColor,
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