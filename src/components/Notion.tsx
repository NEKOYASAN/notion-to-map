import { BlockMapType, NotionRenderer } from 'react-notion/dist'
import React from 'react'
import 'react-notion/src/styles.css'
import 'prismjs/themes/prism-tomorrow.css'

const Notion: React.VFC<{ blockMap: BlockMapType }> = ({ blockMap }) => {
  return <NotionRenderer blockMap={blockMap} />
}

export default Notion
