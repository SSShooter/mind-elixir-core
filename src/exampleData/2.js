import {
  generateUUID,
} from '../../src/utils/index';

export default {
  nodeData: {
    id: generateUUID(),
    topic: 'Second Map',
    root: true,
    children: [
      {
        topic: 'div.map-container',
        id: '33905a6bde6512e4',
        expanded: true,
        children: [
          {
            topic: 'div',
            id: '33905d3c66649e8f',
            tags: ['A special case of grp tag'],
            expanded: true
          },
        ],
      },
      {
        topic: 'div.map-container',
        id: '43905a6bde6512e4',
        expanded: true,
        children: [
          {
            topic: 'div.map-canvas',
            id: '36905d3c66649e8f',
            expanded: true
          },
          { topic: 'Lets play', id: '33905f95arab942d' },
        ],
      },
    ],
  },
  linkData: {},
}
