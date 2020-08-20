import dicktionary from './dicktionary'

const isSwear = (word: string): boolean => {
  return !!dicktionary[word]
}

export default isSwear
