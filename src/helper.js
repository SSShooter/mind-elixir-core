const ApplyStylesOnRootNode = (root_node_id, styleObj) => {
  if (Object.keys(styleObj).length) {
      let tags = document.querySelectorAll(`[data-nodeid="me${root_node_id}"]`);
      if (tags.length) {
          let el = tags[0].style;
          el.background = styleObj.background;
          el.color = styleObj.color;
          el.fontSize = styleObj.fontSize;
          el.fontWeight = styleObj.fontWeight;
      }
  }
}

const updateNodeMenuStyle = (el, state) => {
  if(state == "close") {
    el.style.background = "transparent";
    el.style.boxShadow = "none";
    el.className = 'close'
  } else {
    el.style.background = "#fff";
    el.style.boxShadow = "0 3px 4px 2px rgba(0, 0, 0, 0.2)";
    el.className = ''
  }
}

export {
  ApplyStylesOnRootNode,
  updateNodeMenuStyle
}
