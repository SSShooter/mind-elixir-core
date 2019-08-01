<a name="Mind"></a>

## Mind
**Kind**: global class  

* [Mind](#Mind)
    * _instance_
        * [.#insertSibling(el)](#Mind+insertSibling)
        * [.#addChild(el)](#Mind+addChild)
        * [.#moveUpNode(el)](#Mind+moveUpNode)
        * [.#moveDownNode(el)](#Mind+moveDownNode)
        * [.#removeNode(el)](#Mind+removeNode)
        * [.#moveNode(from, to)](#Mind+moveNode)
        * [.#beginEdit(el)](#Mind+beginEdit)
    * _static_
        * [..E(id)](#Mind.E) ⇒ <code>element</code>

<a name="Mind+insertSibling"></a>

### mind.#insertSibling(el)
Create a sibling node.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind+addChild"></a>

### mind.#addChild(el)
Create a child node.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind+moveUpNode"></a>

### mind.#moveUpNode(el)
Move the target node up.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind+moveDownNode"></a>

### mind.#moveDownNode(el)
Move the target node down.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind+removeNode"></a>

### mind.#removeNode(el)
Remove the target node.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind+moveNode"></a>

### mind.#moveNode(from, to)
Move the target node to another node (as child node).

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>Object</code> | The target you want to move. |
| to | <code>Object</code> | The target you want to move to. |

<a name="Mind+beginEdit"></a>

### mind.#beginEdit(el)
Begin to edit the target node.

**Kind**: instance method of [<code>Mind</code>](#Mind)  

| Param | Type | Description |
| --- | --- | --- |
| el | <code>Object</code> | Target element. |

<a name="Mind.E"></a>

### Mind..E(id) ⇒ <code>element</code>
**Kind**: static method of [<code>Mind</code>](#Mind)  
**Returns**: <code>element</code> - Target element.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Node id. |

