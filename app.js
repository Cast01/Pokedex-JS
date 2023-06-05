const getTypeColor = (type) => {
    const normal = "#F5F5F5";
    return (
        {
            normal,
            fire: "#FDDFDF",
            grass: "#DEFDE0",
            electric: "#FCF7DE",
            ice: "#DEF3FD",
            water: "#DEF3FD",
            ground: "#F4E7DA",
            rock: "#D5D5D4",
            fairy: "#FCEAFF",
            poison: "#98D7A5",
            bug: "#F8D5A3",
            ghost: "#CAC0F7",
            dragon: "#97B3E6",
            psychic: "#EAEDA1",
            fighting: "#E6E0D4",
        }[type] || normal
    );
};

const getOnlyFulFilled = async ({ arr, func }) => {
    // Get pokemon info
    const promises = arr.map(func);
    const responses = await Promise.allSettled(promises);
    return fulfilled = responses.filter(
        (response) => response.status === "fulfilled"
    );
}

const getPokemonTypes = async (pokeApiResults) => {
    const fulfilled = await getOnlyFulFilled({arr: pokeApiResults, func: (result) => fetch(result.url)})
    const pokePromises = fulfilled.map((url) => url.value.json());
    const pokemons = await Promise.all(pokePromises);

    // Get pokemon type
    return pokemons.map((pokemonInfo) =>
        pokemonInfo.types.map((info) => DOMPurify.sanitize(info.type.name))
    );
};

const getPokemonsId = (pokeApiResults) =>
    pokeApiResults.map(({ url }) => {
        const urlAsArray = DOMPurify.sanitize(url).split("/");
        return urlAsArray[urlAsArray.length - 2];
    });

const getPokemonImgs = async (ids) => {
    const fulfilled = await getOnlyFulFilled({arr: ids, func: (id) => fetch(`./assets/img/${id}.png`)})
    return fulfilled.map((response) => response.value.url);
};

const paginationInfo = (() => {
    const limit = 15
    let offset = 0

    const getLimit = () => limit
    const getOffset = () => offset

    const incrementOffset = () => offset += limit

    return {
        getLimit,
        getOffset,
        incrementOffset
    }
})()

const getPokemons = async () => {
    const { getLimit, getOffset, incrementOffset } = paginationInfo

    try {
        const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon?limit=${getLimit()}&offset=${getOffset()}`
        );

        if (!response.ok) {
            throw new Error("Não foi possível carregar os pokemons");
        }

        // Get reference to pokemon info
        const { results: pokeApiResults } = await response.json();
        const pokemonTypes = await getPokemonTypes(pokeApiResults);

        const ids = getPokemonsId(pokeApiResults);
        const imgs = await getPokemonImgs(ids);

        incrementOffset()

        return ids.map((id, i) => (
            {
                id,
                name: pokeApiResults[i].name,
                types: pokemonTypes[i],
                imgUrl: imgs[i]
            }
        ))
    } catch (error) {
        console.log("ERROR: " + error);
    }
}

const renderPokemons = (pokemons) => {
    const ul = document.querySelector('[data-js="pokemons-list"]')
    const fragment = document.createDocumentFragment()

    pokemons.forEach(({ id, name, types, imgUrl }) => {
        const li = document.createElement('li')
        const img = document.createElement('img')
        const nameContainer = document.createElement('h2')
        const typeContainer = document.createElement('p')

        const [firstType] = types

        li.setAttribute('class', `card ${firstType}`)
        li.style.setProperty('--type-color', getTypeColor(firstType))

        img.setAttribute('src', imgUrl)
        img.setAttribute('alt', name)
        img.setAttribute('class', 'card-image')

        nameContainer.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`

        typeContainer.textContent = types.length > 1 ? types.join(' | ') : firstType

        li.append(img, nameContainer, typeContainer)
        
        fragment.append(li)
    });

    ul.append(fragment)

}

const observeLastPokemon = (pokemonsObserver) => {
    const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild
    pokemonsObserver.observe(lastPokemon)
}

const handleNextPokemonsRender = () => {
    const pokemonsObserver = new IntersectionObserver(async ([lastPokemon], observe) => {
        if (!lastPokemon.isIntersecting) {
            return
        }

        observe.unobserve(lastPokemon.target)

        if (paginationInfo.getOffset() === 150) {
            return
        }

        const pokemons = await getPokemons()
        renderPokemons(pokemons)
        observeLastPokemon(pokemonsObserver)
    }, {
        rootMargin: '500px'
    })

    observeLastPokemon(pokemonsObserver)
}

const handlePageLoaded = async () => {
    const pokemons = await getPokemons()

    renderPokemons(pokemons)
    handleNextPokemonsRender()
};

handlePageLoaded();
