import { AppProps } from 'next/app'
import '~/styles/globals.scss'
import Head from 'next/head'
import { ChakraProvider } from '@chakra-ui/react'

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>Notion to Map</title>
        <meta property="og:title" content={'Notion to Map'} />
        <meta
          name="description"
          content={'NotionのDBにあるデータをMapにプロットできるサイトです'}
        />
        <meta
          property="og:description"
          content={'NotionのDBにあるデータをMapにプロットできるサイトです'}
        />
        <meta name="keywords" content="Notion Map Nekoya3" />
        <meta property="og:type" content={'website'} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}ogp.png`} />
        <meta property="og:site_name" content={'Notion to Map'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Nekoya3_" />
        <meta name="twitter:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}`} />
        <meta name="twitter:title" content={'Notion to Map'} />
        <meta
          name="twitter:description"
          content={'NotionのDBにあるデータをMapにプロットできるサイトです'}
        />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}ogp.png`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}`} />
        <link
          rel="shortcut icon"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}android-chrome-192x192.png`}
        />
        <link
          rel="apple-touch-icon"
          type="image/png"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          href={`${process.env.NEXT_PUBLIC_BASE_URL}android-chrome-192x192.png`}
        />
      </Head>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  )
}

export default MyApp
