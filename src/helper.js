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

export {
  ApplyStylesOnRootNode
}
