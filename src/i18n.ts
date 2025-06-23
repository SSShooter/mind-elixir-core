type LangPack = {
  addChild: string
  addParent: string
  addSibling: string
  removeNode: string
  focus: string
  cancelFocus: string
  moveUp: string
  moveDown: string
  link: string
  clickTips: string
  summary: string
}

/**
 * @public
 */
export type Locale = 'cn' | 'zh_CN' | 'zh_TW' | 'en' | 'ru' | 'ja' | 'pt' | 'it' | 'es' | 'fr' | 'ko'
const cn = {
  addChild: '插入子节点',
  addParent: '插入父节点',
  addSibling: '插入同级节点',
  removeNode: '删除节点',
  focus: '专注',
  cancelFocus: '取消专注',
  moveUp: '上移',
  moveDown: '下移',
  link: '连接',
  clickTips: '请点击目标节点',
  summary: '摘要',
}
const i18n: Record<Locale, LangPack> = {
  cn,
  zh_CN: cn,
  zh_TW: {
    addChild: '插入子節點',
    addParent: '插入父節點',
    addSibling: '插入同級節點',
    removeNode: '刪除節點',
    focus: '專注',
    cancelFocus: '取消專注',
    moveUp: '上移',
    moveDown: '下移',
    link: '連接',
    clickTips: '請點擊目標節點',
    summary: '摘要',
  },
  en: {
    addChild: 'Add child',
    addParent: 'Add parent',
    addSibling: 'Add sibling',
    removeNode: 'Remove node',
    focus: 'Focus Mode',
    cancelFocus: 'Cancel Focus Mode',
    moveUp: 'Move up',
    moveDown: 'Move down',
    link: 'Link',
    clickTips: 'Please click the target node',
    summary: 'Summary',
  },
  de: {
    addChild: 'Kindknoten hinzufügen',
    addParent: 'Elternknoten hinzufügen',
    addSibling: 'Geschwisterknoten hinzufügen',
    removeNode: 'Knoten entfernen',
    focus: 'Fokusmodus',
    cancelFocus: 'Fokusmodus abbrechen',
    moveUp: 'Nach oben verschieben',
    moveDown: 'Nach unten verschieben',
    link: 'Verknüpfen',
    clickTips: 'Bitte klicken Sie auf den Zielknoten',
    summary: 'Zusammenfassung',
  },
  ru: {
    addChild: 'Добавить дочерний элемент',
    addParent: 'Добавить родительский элемент',
    addSibling: 'Добавить на этом уровне',
    removeNode: 'Удалить узел',
    focus: 'Режим фокусировки',
    cancelFocus: 'Отменить режим фокусировки',
    moveUp: 'Поднять выше',
    moveDown: 'Опустить ниже',
    link: 'Ссылка',
    clickTips: 'Пожалуйста, нажмите на целевой узел',
    summary: 'Описание',
  },
  ja: {
    addChild: '子ノードを追加する',
    addParent: '親ノードを追加します',
    addSibling: '兄弟ノードを追加する',
    removeNode: 'ノードを削除',
    focus: '集中',
    cancelFocus: '集中解除',
    moveUp: '上へ移動',
    moveDown: '下へ移動',
    link: 'コネクト',
    clickTips: 'ターゲットノードをクリックしてください',
    summary: '概要',
  },
  pt: {
    addChild: 'Adicionar item filho',
    addParent: 'Adicionar item pai',
    addSibling: 'Adicionar item irmao',
    removeNode: 'Remover item',
    focus: 'Modo Foco',
    cancelFocus: 'Cancelar Modo Foco',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    link: 'Link',
    clickTips: 'Favor clicar no item alvo',
    summary: 'Resumo',
  },
  it: {
    addChild: 'Aggiungi figlio',
    addParent: 'Aggiungi genitore',
    addSibling: 'Aggiungi fratello',
    removeNode: 'Rimuovi nodo',
    focus: 'Modalità Focus',
    cancelFocus: 'Annulla Modalità Focus',
    moveUp: 'Sposta su',
    moveDown: 'Sposta giù',
    link: 'Collega',
    clickTips: 'Si prega di fare clic sul nodo di destinazione',
    summary: 'Unisci nodi',
  },
  es: {
    addChild: 'Agregar hijo',
    addParent: 'Agregar padre',
    addSibling: 'Agregar hermano',
    removeNode: 'Eliminar nodo',
    focus: 'Modo Enfoque',
    cancelFocus: 'Cancelar Modo Enfoque',
    moveUp: 'Mover hacia arriba',
    moveDown: 'Mover hacia abajo',
    link: 'Enlace',
    clickTips: 'Por favor haga clic en el nodo de destino',
    summary: 'Resumen',
  },
  fr: {
    addChild: 'Ajout enfant',
    addParent: 'Ajout parent',
    addSibling: 'Ajout voisin',
    removeNode: 'Supprimer',
    focus: 'Cibler',
    cancelFocus: 'Retour',
    moveUp: 'Monter',
    moveDown: 'Descendre',
    link: 'Lier',
    clickTips: 'Cliquer sur le noeud cible',
    summary: 'Annoter',
  },
  ko: {
    addChild: '자식 추가',
    addParent: '부모 추가',
    addSibling: '형제 추가',
    removeNode: '노드 삭제',
    focus: '포커스 모드',
    cancelFocus: '포커스 모드 취소',
    moveUp: '위로 이동',
    moveDown: '아래로 이동',
    link: '연결',
    clickTips: '대상 노드를 클릭하십시오',
    summary: '요약',
  },
}

export default i18n
