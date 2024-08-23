import React from 'react'

export default function Search(props) {

  const {handleApiSearch, searchValue, setSearchValue} = props
  
  return (
    <div>
      <input className='search'
        value={searchValue}
        onChange={(e) => {
            setSearchValue(e.target.value);
            handleApiSearch(e.target.value);  // Automatically search as they type
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                handleApiSearch(searchValue);
                setSearchValue(''); // Reset input after search
            }
        }}
        placeholder="Search Music"
      />
    </div>
  )
}
