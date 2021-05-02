import { NextPage } from 'next'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Stack,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton,
  useToast,
  InputGroup,
  InputRightElement,
  Tooltip,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { Config, Copy, CopyLink, Facebook, Twitter } from '@icon-park/react'
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
  const [stepOneFormState, setStepOneFormState] = useState({
    tableURL: '',
  })
  const [stepTwoFormState, setStepTwoFormState] = useState({
    name: '',
    lng: '',
    lat: '',
    address: '',
    addressPrimary: false,
    popupPage: true,
  })
  const [notionDBID, setNotionDBID] = useState('')
  const { data, error } = useSWR(
    notionDBID ? 'https://notion-api.splitbee.io/v1/table/' + notionDBID : null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [fetcherKeys, setFetcherKeys] = useState<string[]>([])
  const [settingStep, setSettingStep] = useState(1)
  const [settingError, setSettingError] = useState('')
  const [shareModal, setShareModal] = useState(false)
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
  const onClickNext = async (PageURL: string) => {
    setSettingError('')
    try {
      const regex = /(http|https):\/\/[^ "]+\//i
      const test = PageURL.replace(regex, '')
      const regex2 = /\?.+$/i
      const test2 = test.replace(regex2, '')
      const fetchData = await fetch('https://notion-api.splitbee.io/v1/table/' + test2)
      const json: Array<any> = await fetchData.json()
      let keys: string[] = []
      json.forEach((obje) => {
        keys = keys.concat(Object.keys(obje))
      })
      keys = Array.from(new Set(keys))
      if (keys.length) {
        setFetcherKeys(keys)
        setSettingStep(2)
        setLoading(false)
      } else {
        setSettingError('データが存在しませんでした。NotionのURLが正しいことを確認してください。')
        setLoading(false)
      }
    } catch (e) {
      setSettingError('データが存在しませんでした。NotionのURLが正しいことを確認してください。')
      setLoading(false)
    }
  }

  const onClickSuccess = () => {
    setLoading(true)
    if (
      ((stepTwoFormState.lat && stepTwoFormState.lng) || stepTwoFormState.address) &&
      stepTwoFormState.name
    ) {
      const regex = /(http|https):\/\/[^ "]+\//i
      const test = stepOneFormState.tableURL.replace(regex, '')
      const regex2 = /\?.+$/i
      const test2 = test.replace(regex2, '')
      setNotionDBID(test2)
      setColumnName((prevState) => {
        return {
          ...prevState,
          name: stepTwoFormState.name,
          lng: stepTwoFormState.lng,
          lat: stepTwoFormState.lat,
          address: stepTwoFormState.address,
        }
      })
      setMapSetting((prevState) => {
        return {
          ...prevState,
          addressPrimary: stepTwoFormState.addressPrimary,
          popupPage: stepTwoFormState.popupPage,
        }
      })

      router.push(
        {
          pathname: '/',
          query: {
            notionDBID: test2,
            name: stepTwoFormState.name,
            lng: stepTwoFormState.lng,
            lat: stepTwoFormState.lat,
            address: stepTwoFormState.address,
            addressPrimary: stepTwoFormState.addressPrimary,
            popupPage: stepTwoFormState.popupPage,
          },
        },
        undefined,
        { shallow: true }
      )
      onClose()
      setStepOneFormState({
        tableURL: '',
      })
      setStepTwoFormState({
        name: '',
        lng: '',
        lat: '',
        address: '',
        addressPrimary: false,
        popupPage: true,
      })
      setFetcherKeys([])
      setSettingStep(1)
      setSettingError('')
    }
  }

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
  }, error)

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
  }, data)
  useEffect(() => {
    const { query } = router
    if (
      query &&
      query.notionDBID &&
      query.name &&
      query.lng &&
      query.lat &&
      query.address &&
      query.addressPrimary &&
      query.popupPage
    ) {
      setNotionDBID(String(query.notionDBID))
      setColumnName((prevState) => {
        return {
          ...prevState,
          name: String(query.name),
          lng: String(query.lng),
          lat: String(query.lat),
          address: String(query.address),
        }
      })
      setMapSetting((prevState) => {
        return {
          ...prevState,
          addressPrimary: Boolean(query.addressPrimary),
          popupPage: Boolean(query.popupPage),
        }
      })
    }
  }, [router])
  return (
    <Box h={'100vh'} w={'100vw'} maxH={'100vh'} minH={'100vh'} maxW={'100vw'} minW={'100vw'}>
      {!router.query.embed ? (
        <Flex
          as={'header'}
          height={'45px'}
          verticalAlign={'center'}
          alignItems={'center'}
          px={'20px'}
        >
          <Heading size={'18px'}>Notion to Map</Heading>
          <Spacer />
          {geoState.length ? (
            <Button
              mr={6}
              colorScheme={'blue'}
              onClick={() => {
                onOpen()
                setShareModal(true)
              }}
            >
              地図をシェアする
            </Button>
          ) : undefined}
          <Tooltip label="設定">
            <IconButton
              variant={'transparent'}
              aria-label={'setting'}
              icon={<Icon as={Config} />}
              onClick={() => {
                onOpen()
              }}
            />
          </Tooltip>
        </Flex>
      ) : undefined}
      <Box
        position={'relative'}
        overflow={'hidden'}
        h={!router.query.embed ? 'calc(100vh - 45px)' : '100vh'}
      >
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
          setShareModal(false)
        }}
        isOpen={isOpen}
      >
        <ModalOverlay />
        <ModalContent>
          {(() => {
            if (shareModal) {
              return (
                <>
                  <ModalHeader>Mapをシェアする</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Box>
                      <FormLabel>Share URL</FormLabel>
                      <InputGroup size="md">
                        <Input
                          type={'text'}
                          readOnly
                          value={document.location.origin + router.asPath}
                        />
                        <InputRightElement>
                          <Tooltip label="URLをコピーする">
                            <IconButton
                              aria-label={'URLをコピーする'}
                              icon={<Icon as={CopyLink} />}
                              roundedLeft={0}
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard
                                    .writeText(document.location.origin + router.asPath)
                                    .then(() => {
                                      toast({
                                        title: 'URLをコピーしました',
                                        status: 'info',
                                        duration: 9000,
                                        isClosable: true,
                                        position: 'top',
                                      })
                                    })
                                }
                              }}
                            />
                          </Tooltip>
                        </InputRightElement>
                      </InputGroup>
                      <Flex m={3}>
                        <Button
                          aria-label={'Twitterでシェア'}
                          colorScheme={'twitter'}
                          leftIcon={<Icon as={Twitter} />}
                          onClick={() => {
                            window.open(
                              'https://twitter.com/intent/tweet?text=Notion to Map&url=' +
                                encodeURIComponent(document.location.origin + router.asPath)
                            )
                          }}
                        >
                          Twitterでシェア
                        </Button>
                        <Spacer />
                        <Button
                          aria-label={'Facebookでシェア'}
                          leftIcon={<Icon as={Facebook} />}
                          colorScheme={'facebook'}
                          onClick={() => {
                            window.open(
                              'https://www.facebook.com/sharer.php?u=' +
                                encodeURIComponent(document.location.origin + router.asPath)
                            )
                          }}
                        >
                          Facebookでシェア
                        </Button>
                      </Flex>
                      <Accordion allowToggle>
                        <AccordionItem>
                          <p>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                iframe Code
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </p>
                          <AccordionPanel>
                            <InputGroup size="md">
                              <Textarea
                                readOnly
                                pr={12}
                                value={
                                  '<iframe width="560" height="315" src="' +
                                  document.location.origin +
                                  router.asPath +
                                  '&embed=true' +
                                  '" frameborder="0"></iframe>'
                                }
                              />
                              <InputRightElement>
                                <Tooltip label="iframe コードをコピー">
                                  <IconButton
                                    aria-label={'iframe コードをコピー'}
                                    icon={<Icon as={Copy} />}
                                    roundedLeft={0}
                                    onClick={() => {
                                      if (navigator.clipboard) {
                                        navigator.clipboard
                                          .writeText(
                                            '<iframe width="560" height="315" src="' +
                                              document.location.origin +
                                              router.asPath +
                                              '&embed=true' +
                                              '" frameborder="0"></iframe>'
                                          )
                                          .then(() => {
                                            toast({
                                              title: 'iframeコードをコピーしました',
                                              status: 'info',
                                              duration: 9000,
                                              isClosable: true,
                                              position: 'top',
                                            })
                                          })
                                      }
                                    }}
                                  />
                                </Tooltip>
                              </InputRightElement>
                            </InputGroup>
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    </Box>
                  </ModalBody>
                </>
              )
            }
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
            if (settingStep === 1) {
              return (
                <>
                  <ModalHeader>Notion Setting 1/2</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    {settingError ? (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertTitle mr={2}>{settingError}</AlertTitle>
                        <CloseButton position="absolute" right="8px" top="8px" />
                      </Alert>
                    ) : undefined}
                    <FormControl isRequired>
                      <FormLabel>Table URL</FormLabel>
                      <Input
                        name={'TableURL'}
                        onChange={(e) => {
                          setStepOneFormState((currentState) => {
                            return {
                              ...currentState,
                              tableURL: e.target.value,
                            }
                          })
                        }}
                      />
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={onClose} isLoading={loading}>
                      Cancel
                    </Button>
                    <Spacer />
                    <Button
                      isLoading={loading}
                      colorScheme="teal"
                      onClick={async () => {
                        setLoading(true)
                        if (stepOneFormState.tableURL) {
                          await onClickNext(stepOneFormState.tableURL)
                        } else {
                          setSettingError('tableURLを入力してください')
                          setLoading(false)
                        }
                      }}
                    >
                      Next &gt;
                    </Button>
                  </ModalFooter>
                </>
              )
            } else if (settingStep === 2) {
              return (
                <>
                  <ModalHeader>Notion Setting 2/2</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    {settingError ? (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertTitle mr={2}>{settingError}</AlertTitle>
                        <CloseButton position="absolute" right="8px" top="8px" />
                      </Alert>
                    ) : undefined}
                    <FormControl>
                      <FormLabel>名前カラム</FormLabel>
                      <Select
                        placeholder="Select option"
                        onChange={(e) => {
                          setStepTwoFormState((currentState) => {
                            return {
                              ...currentState,
                              name: e.target.value,
                            }
                          })
                        }}
                      >
                        {fetcherKeys.map((d) => {
                          return (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        })}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>緯度カラム</FormLabel>
                      <Select
                        placeholder="Select option"
                        onChange={(e) => {
                          setStepTwoFormState((currentState) => {
                            return {
                              ...currentState,
                              lat: e.target.value,
                            }
                          })
                        }}
                      >
                        {fetcherKeys.map((d) => {
                          return (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        })}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>経度カラム</FormLabel>
                      <Select
                        placeholder="Select option"
                        onChange={(e) => {
                          setStepTwoFormState((currentState) => {
                            return {
                              ...currentState,
                              lng: e.target.value,
                            }
                          })
                        }}
                      >
                        {fetcherKeys.map((d) => {
                          return (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        })}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>住所カラム</FormLabel>
                      <Select
                        placeholder="Select option"
                        onChange={(e) => {
                          setStepTwoFormState((currentState) => {
                            return {
                              ...currentState,
                              address: e.target.value,
                            }
                          })
                        }}
                      >
                        {fetcherKeys.map((d) => {
                          return (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          )
                        })}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Options</FormLabel>
                      <Stack spacing={10}>
                        <Checkbox
                          onChange={(e) => {
                            setStepTwoFormState((currentState) => {
                              return {
                                ...currentState,
                                addressPrimary: e.target.checked,
                              }
                            })
                          }}
                        >
                          緯度・経度データと住所データの両方が存在する時に住所データを優先する（Offの場合緯度・経度データが優先されます）
                        </Checkbox>
                        <Checkbox
                          onChange={(e) => {
                            setStepTwoFormState((currentState) => {
                              return {
                                ...currentState,
                                popupPage: e.target.checked,
                              }
                            })
                          }}
                        >
                          クリック時にPageをモーダルで表示する（Offの場合Popupで名前が表示されます）
                        </Checkbox>
                      </Stack>
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button onClick={onClose} isLoading={loading}>
                      Cancel
                    </Button>
                    <Spacer />
                    <Button
                      isLoading={loading}
                      colorScheme="teal"
                      onClick={() => {
                        onClickSuccess()
                      }}
                    >
                      Success!
                    </Button>
                  </ModalFooter>
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
