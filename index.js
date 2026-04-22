const cardsElement = document.getElementById("cards");
const overlay = document.getElementById("overlay");
const overlay2 = document.getElementsByClassName("overlay2")[0];
const background = document.getElementById("background");
const [addFolder, backgroundButton, importExportButton] = Array.from(document.querySelector("#controls-wrapper").children);
const cardModal = document.getElementsByClassName("card-modal-container")[0];
const titleElement = document.getElementById("title");
const urlElement = document.getElementById("url");
const incognitoElement = document.getElementById("incognito");
const [successEditModalButton, cancelEditModalButton] = Array.from(document.querySelector(".modal-controls-wrapper > .icons-wrap").children)
const bgModal = document.getElementsByClassName("bg-modal-container")[0];
const bgInput = document.getElementById("bg-input");
const bgArea = document.getElementById("bg-input-area");
const bgFileName = document.querySelector("#bg-modal > .sections > .file-name");
const backgroundModalButtons = document.querySelector("#bg-modal > .sections > .icons-wrap")
const [successBgChangeButton, cancelBgChangeButton] = Array.from(backgroundModalButtons.children)
const folderModal = document.getElementsByClassName("folder-modal-container")[0];
const folderTitle = document.getElementById("folder-title")
const folderContent = document.getElementById("folder-content");
const importExportModal = document.getElementsByClassName("import-export-modal-container")[0];
const exportButton = document.getElementById("export-button");
const exportFileName = document.getElementById("export-file-name");
const importInput = document.getElementById("import-input");
const importArea = document.getElementsByClassName("import-input-area")[0];
const importFileName = document.querySelector("#import-export-modal > .sections > .file-name");
const importModalButtons = document.querySelector("#import-export-modal > .sections > .icons-wrap")
const [successConfigModalButton, cancelConfigModalButton] = Array.from(importModalButtons.children)
const notification = document.getElementById("notification");

const tabGroupsButton = document.getElementsByClassName("tab-groups-button")[0];
const tabGroupsModal = document.getElementsByClassName("tab-groups-modal-container")[0];
const tabGroupsContainer = document.getElementsByClassName("tab-groups-container")[0];

let savedTabGroups = {};
let cardList = [];
let flag;
let imgPreview;
let timeout;
let configData;
let savedFolderPosition;

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    resetModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (!overlay2.classList.contains("hide")) {
    if (e.code === "Enter") {
      editCardData();
    }
  }
});

const optDropdownMenu = document.getElementsByClassName("options-dropdown-menu")[0];

tabGroupsButton.addEventListener("click", async () => {
  resetModal();
  overlay.classList.remove("hide");
  tabGroupsModal.classList.remove("hide");

  tabGroupsContainer.innerHTML = "";

  const fetchedTabGroups = await fetchTabGroupData();
  savedTabGroups = fetchedTabGroups;

  Object.entries(fetchedTabGroups).map(async ([key, { title, color, list }]) => {
    const groupContainer = document.createElement("div");
    groupContainer.classList.add("group-container");
    groupContainer.id = key;
    const groupTitleWrapper = document.createElement("div");
    groupTitleWrapper.classList.add("group-title-wrapper");
    groupTitleWrapper.style.backgroundColor = color;
    const groupTitle = document.createElement("span");
    groupTitle.classList.add("group-title");
    groupTitle.innerText = title;
    groupTitleWrapper.appendChild(groupTitle);
    const optionsButton = document.createElement("div");
    optionsButton.innerHTML = "<div>...</div>";
    optionsButton.classList.add("group-options-button");
    optionsButton.addEventListener("click", (event) => {
      const rect = event.target.getBoundingClientRect();

      optDropdownMenu.style.top = `${rect.bottom + 10}px`;
      optDropdownMenu.style.left = `${rect.left}px`;

      optDropdownMenu.classList.remove("hide")
      optDropdownMenu.focus();
    })
    //createBookmarkFromTabGroup(key)
    groupTitleWrapper.appendChild(optionsButton)
    const groupList = document.createElement("div");
    groupList.classList.add("group-list");

    list.map(({ id, favIconUrl, title }) => {
      const groupItem = document.createElement("div");
      groupItem.id = id;
      groupItem.classList.add("group-item");
      const itemImg = document.createElement("img");

      groupItem.innerText = title;

      if (favIconUrl) {
        itemImg.src = favIconUrl;
        itemImg.width = 20;
        itemImg.style.marginRight = "10px";
        groupItem.prepend(itemImg);
      }

      groupList.appendChild(groupItem);
    })

    groupContainer.appendChild(groupTitleWrapper);
    groupContainer.appendChild(groupList);
    tabGroupsContainer.appendChild(groupContainer);
  })
})

optDropdownMenu.addEventListener("blur", (e) => e.target.classList.add("hide"))

const createBookmarkFromTabGroup = async (tabGroupId) => {
  const { title, list } = savedTabGroups[tabGroupId];

  if (window.confirm("Are you sure you want to make this Tab Group into bookmark folder?")) {
    // 1 is favorites bar
    // 57 is id of "other favorites" 
    // 86 is for "mobile favorites"
    const folder = await chrome.bookmarks.create({
      parentId: "57",
      title: title
    });

    await Promise.all(list.map(({ title, url }) => {
      chrome.bookmarks.create({
        parentId: folder.id,
        title,
        url
      })
    }))
  }
}

successEditModalButton.addEventListener("click", () => editCardData())
cancelEditModalButton.addEventListener("click", () => resetModal())

Array.from([overlay, overlay2]).forEach(el =>
  el.addEventListener("click", (e) => {
    (imgPreview) ? renderBackground() : "";
    resetModal()
  }))

overlay.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
})

overlay.addEventListener("drop", dropFromFolderEvent)

Array.from([bgArea, importArea]).forEach(el =>
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    el.classList.add("drag-over");
  }));

Array.from([bgArea, importArea]).forEach((el, idx) =>
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];

    if (idx === 0) {
      handleImage(file);
    } else {
      extractDataFromFile(file);
    }
  }));

Array.from([bgArea, importArea]).forEach(el =>
  el.addEventListener("dragleave", () => {
    el.classList.remove("drag-over");
  }));


Array.from([cardModal, folderModal, importExportModal, bgModal]).forEach(modal =>
  modal.addEventListener("click", (e) => {
    e.stopPropagation()
  }))

cancelBgChangeButton.addEventListener("click", () => {
  bgArea.classList.remove("hide")
  backgroundModalButtons.classList.add("hide")
  bgFileName.innerText = "";
  overlay.style.backdropFilter = "blur(3px)";
  renderBackground();
});

successBgChangeButton.addEventListener("click", () => {
  updateLocalStorage("background", imgPreview);
  overlay.style.backdropFilter = "blur(3px)";
  resetModal();
});

cancelConfigModalButton.addEventListener("click", () => {
  importArea.classList.remove("hide")
  importModalButtons.classList.add("hide")

  importFileName.innerText = "";
  configData = null;
});

successConfigModalButton.addEventListener("click", () => {
  if (configData) {
    validateDataFromFile(configData);
  } else {
    console.log("Some of the data is not valid!")
  }
  resetModal();
});

folderTitle.addEventListener("blur", () => {
  if (savedFolderPosition) {
    const updatedCards = cardList.map(card => {
      if (card.position === Number(savedFolderPosition) && card.type === "folder") {
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

exportButton.addEventListener("click", downloadFile)

bgInput.addEventListener("change", (e) => {
  handleImage(e.target.files[0]);
});

importInput.addEventListener("change", (e) => {
  notification.innerText = ""
  const file = e.target.files[0];

  extractDataFromFile(file)
})

backgroundButton.addEventListener("click", (e) => {
  bgModal.classList.toggle("hide");
  overlay.classList.remove("hide");
  importExportModal.classList.add("hide");
  overlay2.classList.add("hide");
  folderModal.classList.add("hide");
});

importExportButton.addEventListener("click", (e) => {
  importExportModal.classList.toggle("hide");
  overlay.classList.remove("hide");
  overlay2.classList.add("hide");
  bgModal.classList.add("hide");
  folderModal.classList.add("hide");
  notification.innerText = "";
});

folderContent.addEventListener("dragstart", (e) => {
  e.stopPropagation()
  e.dataTransfer.setData("src", e.target.getAttribute("position"));
});

folderContent.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
});

folderContent.addEventListener("drop", async (e) => {
  e.stopPropagation()

  if (e.target !== folderContent) {
    const folderPos = Number(savedFolderPosition)
    const foundFolder = cardList.find(card => card.position === folderPos)
    const updatedList = await dropEvent(e, foundFolder.cards, folderContent)

    const updatedCards = cardList.map(card => {
      if (card.position === folderPos) {
        return {
          ...card,
          cards: updatedList
        }
      }
      return card
    })

    updateLocalStorage("cards", updatedCards)
    renderCards(updatedCards)
  }
})

addFolder.addEventListener("click", () => {
  if (cardList.length >= 20 && Array.from(cardsElement.children).length >= 20) {
    console.log("cards capacity is full")
    return;
  } else {
    const result = createFolder(null);
    (result) ? cardList.push({ type: "folder", name: "", cards: [], position: cardList.length }) : "";
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

const editCardData = () => {
  setData({ newTitle: titleElement.value, newUrl: urlElement.value });
  flag[1].querySelector(".bottom-title").innerHTML = titleElement.value;
  flag[1].href = urlElement.value;

  resetModal();
};

document.addEventListener("DOMContentLoaded", () => {
  makeTextInputUndroppable();
  stopModalPropagations();
  renderBackground();
  renderCards();
});

const fetchTabGroupData = async () => {
  const tabGroups = {}

  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.groupId && tab.groupId !== -1) {
      if (tabGroups[tab.groupId] && tabGroups[tab.groupId].list.length > 0) {
        tabGroups[tab.groupId].list.push(tab);
      } else {
        const fetchedGroupData = await chrome.tabGroups.get(tab.groupId);
        tabGroups[tab.groupId] = { title: fetchedGroupData.title, color: fetchedGroupData.color, list: [tab] };
      }
    }
  }

  return tabGroups;
}