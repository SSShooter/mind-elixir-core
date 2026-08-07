import MindElixir from '../src'
import type { MindElixirData, NodeObj, Options } from '../src'

type Metadata = {
  refId: string
  priority?: number
}

declare const options: Options<Metadata>
declare const data: MindElixirData<Metadata>

const mind = null as unknown as MindElixir<Metadata>
const initialized: ReturnType<MindElixir<Metadata>['init']> = mind.init(data)
const result: MindElixirData<Metadata> = mind.getData()
const metadata: Metadata | undefined = result.nodeData.metadata
const child: NodeObj<Metadata> | undefined = result.nodeData.children?.[0]

void options
void initialized
void metadata
void child
