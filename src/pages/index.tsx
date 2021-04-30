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
  Text,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  CloseButton,
  useToast,
} from '@chakra-ui/react'
import { Config } from '@icon-park/react'
import { DeckGL } from '@deck.gl/react'
import { StaticMap } from 'react-map-gl'
import { useEffect, useState } from 'react'
import { ScatterplotLayer } from '@deck.gl/layers'
import useSWR from 'swr'
import { Position } from '@deck.gl/core/utils/positions'

const Home: NextPage = () => {
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
  const [stepOneFormState, setStepOneFormState] = useState({
    tableURL: '',
  })
  const [stepTwoFormState, setStepTwoFormState] = useState({
    name: '',
    lng: '',
    lat: '',
    address: '',
    addressPrimary: false,
    popupPage: false,
  })
  const [notionPageID, setNotionPageID] = useState('')
  const { data, error } = useSWR(
    notionPageID ? 'https://notion-api.splitbee.io/v1/table/' + notionPageID : null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [fetcherKeys, setFetcherKeys] = useState<string[]>([])
  const [settingStep, setSettingStep] = useState(1)
  const [settingError, setSettingError] = useState('')
  const onClickNext = async (PageURL: string) => {
    setSettingError('')
    try {
      const regex = /(http|https):\/\/[^ "]+\//i
      const test = PageURL.replace(regex, '')
      const regex2 = /\?.+$/i
      const test2 = test.replace(regex2, '')
      const fetchData = await fetch('https://notion-api.splitbee.io/v1/table/' + test2)
      const json: Array<any> = await fetchData.json()
      if (json[0]) {
        const keys = Object.keys(json[0])
        if (keys.length) {
          setFetcherKeys(keys)
          setSettingStep(2)
          setLoading(false)
        } else {
          setSettingError('データが存在しませんでした。NotionのURLが正しいことを確認してください。')
          setLoading(false)
        }
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
      setNotionPageID(test2)
      setColumnName((prevState) => {
        return {
          ...prevState,
          name: stepTwoFormState.name,
          lng: stepTwoFormState.lng,
          lat: stepTwoFormState.lat,
          address: stepTwoFormState.address,
        }
      })
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
        popupPage: false,
      })
      setFetcherKeys([])
      setSettingStep(1)
      setSettingError('')
    }
    setLoading(false)
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
  return (
    <Box h={'100vh'} w={'100vw'} maxH={'100vh'} minH={'100vh'} maxW={'100vw'} minW={'100vw'}>
      <Flex
        as={'header'}
        height={'45px'}
        verticalAlign={'center'}
        alignItems={'center'}
        px={'20px'}
      >
        <Heading size={'18px'}>Notion to Map</Heading>
        <Spacer />
        <IconButton
          variant={'transparent'}
          aria-label={'setting'}
          icon={<Icon as={Config} />}
          onClick={() => {
            onOpen()
          }}
        />
      </Flex>
      <Box position={'relative'} overflow={'hidden'} h={'calc(100vh - 45px)'}>
        <DeckGL
          width={'100%'}
          height={'100%'}
          controller
          layers={[
            new ScatterplotLayer({
              id: 'scatterplot-layer',
              data,
              pickable: true,
              opacity: 1,
              stroked: true,
              filled: true,
              radiusScale: 6,
              radiusMinPixels: 10,
              radiusMaxPixels: 100,
              lineWidthMinPixels: 1,
              getPosition: (d: any): Position => {
                return [d[columnName.lng], d[columnName.lat]]
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
          />
          <Box position={'absolute'} top={0} right={0} bgColor={'white'}>
            {data
              ? data.map((d: any) => {
                  return (
                    <Text key={d[columnName.name]}>
                      {d[columnName.name]} , {d[columnName.lng]} , {d[columnName.lat]}
                    </Text>
                  )
                })
              : undefined}
          </Box>
        </DeckGL>
      </Box>

      <Modal onClose={onClose} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          {(() => {
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
