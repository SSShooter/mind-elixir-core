import {
  generateUUID,
} from '../../src/utils/index';

export default {
  nodeData: {
    id: generateUUID(),
    topic: 'Third Map',
    root: true,
    children: [
      {
        topic: 'Hello World',
        id: 'bd1e217f9d0b20bd',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Extract plus',
            id: 'bq1d0317f7e8a61a',
            icons: [],
            tags: ['www'],
          },
        ],
      },
      {
        topic: 'Use words',
        id: 'ad1f03fee1f63bc6',
        direction: 1,
        expanded: true,
        children: [
          {
            topic:
              'Drag a node',
            id: 'bd1f07c598e729dc',
          },
        ],
      }
    ],
    expanded: true,
  },
  linkData: {},
}
