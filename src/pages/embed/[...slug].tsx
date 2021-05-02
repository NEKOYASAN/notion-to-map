import { NextPage } from 'next'
import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { DeckGL } from '@deck.gl/react'
import { FlyToInterpolator, Popup, StaticMap } from 'react-map-gl'
import { useEffect, useState } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import useSWR from 'swr'
import React from 'react'
import { Position } from '@deck.gl/core/utils/positions'
import { BlockMapType } from 'react-notion/dist'
import Notion from '~/components/Notion'
import { useRouter } from 'next/router'

interface infoType {
  coordinate: Position
  name: string
}

const Home: NextPage = () => {
  const router = useRouter()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [viewport, setViewport] = useState({
    width: 400,
    height: 400,
    latitude: 35.680452236862294,
    longitude: 139.76973380332117,
    zoom: 15,
  })
  const [columnName, setColumnName] = useState({
    name: 'Name',
    lng: 'lng',
    lat: 'lat',
    address: 'address',
  })
  const [mapSetting, setMapSetting] = useState({
    addressPrimary: false,
    popupPage: true,
  })

  const [blockMap, setBlockMap] = useState<undefined | BlockMapType>(undefined)
  const [notionDBID, setNotionDBID] = useState('')
  const { data, error } = useSWR(
    notionDBID ? 'https://notion-api.splitbee.io/v1/table/' + notionDBID : null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [geoState, setGeoState] = useState<
    {
      id: string
      coordinates: Position
      name: string
    }[]
  >([])
  const [infoState, setInfoState] = useState<infoType | undefined>(undefined)
  const geocodingFunc = (address: string) =>
    new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      getLatLng(
        address,
        (latlng: any) => {
          resolve([Number(latlng.lng), Number(latlng.lat)])
        },
        () => {
          reject()
        }
      )
    })

  useEffect(() => {
    if (error) {
      toast({
        title: 'データ取得にエラーが発生しました',
        description: '右上の設定ボタンより再度設定を行ってください',
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }, [error])

  useEffect(() => {
    if (data) {
      const f = async () => {
        const datas = data.map(async (d: any) => {
          if (mapSetting.addressPrimary && columnName.address) {
            if (d[columnName.address]) {
              // Geolonia Community Geocoding API
              const pos = await geocodingFunc(d[columnName.address])
              return {
                id: d.id,
                coordinates: pos,
                name: d[columnName.name],
              }
            } else {
              return {
                id: d.id,
                coordinates: [d[columnName.lng], d[columnName.lat]],
                name: d[columnName.name],
              }
            }
          } else {
            if (d[columnName.lng] && d[columnName.lat]) {
              return {
                id: d.id,
                coordinates: [d[columnName.lng], d[columnName.lat]],
                name: d[columnName.name],
              }
            } else if (d[columnName.address]) {
              // Geolonia Community Geocoding API
              const pos = await geocodingFunc(d[columnName.address])
              return {
                id: d.id,
                coordinates: pos,
                name: d[columnName.name],
              }
            }
          }
        })
        const test = await Promise.all(datas)
        if (loading) {
          if (test.length) {
            setViewport((prevState) => {
              return {
                ...prevState,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                longitude: test[0].coordinates[0],
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                latitude: test[0].coordinates[1],
                transitionDuration: 1500,
                transitionInterpolator: new FlyToInterpolator(),
              }
            })
          }
          setLoading(false)
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        setGeoState(test)
      }
      f()
    }
  }, [data])
  useEffect(() => {
    const { query } = router
    if (query && query.slug && query.slug.length >= 7) {
      setNotionDBID(String(query.slug[0]))
      setColumnName((prevState) => {
        return {
          ...prevState,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          name: String(query.slug[1]),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          lng: String(query.slug[2]),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          lat: String(query.slug[3]),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          address: String(query.slug[4]),
        }
      })
      setMapSetting((prevState) => {
        return {
          ...prevState,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          addressPrimary: Boolean(query.slug[5]),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          popupPage: Boolean(query.slug[6]),
        }
      })
    }
  }, [router])
  return (
    <Box h={'100vh'} w={'100vw'} maxH={'100vh'} minH={'100vh'} maxW={'100vw'} minW={'100vw'}>
      <Box position={'relative'} overflow={'hidden'} h={'100vh'}>
        <DeckGL
          width={'100%'}
          height={'100%'}
          controller
          layers={[
            new ScatterplotLayer({
              id: 'scatterplot-layer',
              data: geoState,
              pickable: true,
              opacity: 1,
              stroked: true,
              filled: true,
              radiusScale: 6,
              radiusMinPixels: 10,
              radiusMaxPixels: 100,
              lineWidthMinPixels: 1,
              getPosition: (d: any): Position => {
                return d.coordinates
              },
              onClick: (d: any) => {
                if (mapSetting.popupPage) {
                  fetch('https://notion-api.splitbee.io/v1/page/' + d.object.id)
                    .then((res) => {
                      return res.json()
                    })
                    .then((json) => {
                      setBlockMap(json)
                      onOpen()
                    })
                } else {
                  if (d.coordinate) {
                    setInfoState({
                      coordinate: d.coordinate,
                      name: d.object.name,
                    })
                  }
                }
              },
            }),
          ]}
          viewState={viewport}
          onViewStateChange={(viewState) => setViewport(viewState.viewState)}
        >
          <StaticMap
            width={100}
            height={100}
            mapStyle={
              'https://api.maptiler.com/maps/jp-mierune-streets/style.json?key=' +
              process.env.NEXT_PUBLIC_MAPTILER_ACCESS_TOKEN
            }
            mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESSS_TOKEN}
          >
            {infoState ? (
              <Popup
                longitude={infoState.coordinate[0]}
                latitude={infoState.coordinate[1]}
                closeButton={true}
                closeOnClick={true}
              >
                <div>
                  <p>{infoState.name}</p>
                </div>
              </Popup>
            ) : undefined}
          </StaticMap>
        </DeckGL>
      </Box>

      <Modal
        onClose={() => {
          onClose()
          setBlockMap(undefined)
        }}
        isOpen={isOpen}
      >
        <ModalOverlay />
        <ModalContent>
          {(() => {
            if (blockMap && mapSetting.popupPage) {
              return (
                <>
                  <ModalHeader>Notion Page</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Notion blockMap={blockMap} />
                  </ModalBody>
                </>
              )
            }
          })()}
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Home
