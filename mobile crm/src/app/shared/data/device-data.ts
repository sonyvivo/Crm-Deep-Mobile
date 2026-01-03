export const DEVICE_BRANDS = [
    // Mobiles
    'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Realme', 'Oppo', 'Vivo', 'OnePlus',
    'Motorola', 'Google', 'Nothing', 'Poco', 'iQOO', 'Infinix', 'Tecno', 'Lava', 'Nokia',
    // Laptops
    'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Apple (MacBook)', 'Microsoft'
];

export const DEVICE_MODELS: { [key: string]: string[] } = {
    'Apple': [
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
        'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
        'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
        'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
        'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
        'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
        'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7', 'iPhone SE',
        'iPad Pro', 'iPad Air', 'iPad Mini', 'iPad'
    ],
    'Samsung': [
        'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
        'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
        'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
        'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy S21 FE',
        'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy Z Fold 4', 'Galaxy Z Flip 4',
        'Galaxy A55', 'Galaxy A35', 'Galaxy A54', 'Galaxy A34', 'Galaxy A15', 'Galaxy A14',
        'Galaxy M55', 'Galaxy M34', 'Galaxy M14', 'Galaxy F54', 'Galaxy F34'
    ],
    'Xiaomi': [
        'Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Xiaomi 13',
        'Xiaomi 12 Pro', 'Xiaomi 11T Pro', 'Xiaomi 11i', 'Mi 11X'
    ],
    'Redmi': [
        'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
        'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
        'Redmi 13C', 'Redmi 12', 'Redmi 12C', 'Redmi A3', 'Redmi A2'
    ],
    'Realme': [
        'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12', 'Realme 12x',
        'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 11',
        'Realme GT 2 Pro', 'Realme GT Neo 3',
        'Realme Narzo 70 Pro', 'Realme Narzo 60', 'Realme Narzo N55',
        'Realme C67', 'Realme C55', 'Realme C53'
    ],
    'OnePlus': [
        'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R',
        'OnePlus 10 Pro', 'OnePlus 10R', 'OnePlus 10T',
        'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 9R', 'OnePlus 9RT',
        'OnePlus Nord 4', 'OnePlus Nord CE 4', 'OnePlus Nord 3', 'OnePlus Nord CE 3',
        'OnePlus Nord CE 3 Lite', 'OnePlus Nord CE 2 Lite'
    ],
    'Vivo': [
        'Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo X90',
        'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo V29e',
        'Vivo V27 Pro', 'Vivo V27',
        'Vivo T3', 'Vivo T2 Pro', 'Vivo T2x',
        'Vivo Y200', 'Vivo Y200e', 'Vivo Y56', 'Vivo Y16', 'Vivo Y02'
    ],
    'Oppo': [
        'Oppo Find N3 Flip', 'Oppo Find N2 Flip',
        'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro+', 'Oppo Reno 10 Pro',
        'Oppo F25 Pro', 'Oppo F23', 'Oppo F21 Pro',
        'Oppo A79', 'Oppo A78', 'Oppo A59', 'Oppo A38', 'Oppo A18'
    ],
    'Motorola': [
        'Moto Edge 50 Pro', 'Moto Edge 40 Neo', 'Moto Edge 40',
        'Moto G84', 'Moto G54', 'Moto G34', 'Moto G24 Power',
        'Moto Razr 40 Ultra', 'Moto Razr 40'
    ],
    'Google': [
        'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
        'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a'
    ],
    'Nothing': [
        'Nothing Phone (2a)', 'Nothing Phone (2)', 'Nothing Phone (1)'
    ],
    'Poco': [
        'Poco X6 Pro', 'Poco X6', 'Poco F5',
        'Poco M6 Pro', 'Poco M6', 'Poco C65', 'Poco C61'
    ],
    'iQOO': [
        'iQOO 12', 'iQOO 11', 'iQOO Neo 9 Pro', 'iQOO Neo 7 Pro',
        'iQOO Z9', 'iQOO Z7 Pro', 'iQOO Z7s'
    ],
    // Laptops
    'HP': [
        'Pavilion 15', 'Pavilion 14', 'Pavilion x360', 'Pavilion Gaming',
        'Envy 13', 'Envy 15', 'Envy x360',
        'Spectre x360',
        'Omen 16', 'Victus 15', 'Victus 16',
        'HP 15s', 'HP 14s', 'ProBook', 'EliteBook'
    ],
    'Dell': [
        'Inspiron 15 3000', 'Inspiron 15 5000', 'Inspiron 14', 'Inspiron 16',
        'XPS 13', 'XPS 15', 'XPS 17',
        'Vostro 3000', 'Vostro 5000',
        'G15 Gaming', 'Alienware m15', 'Alienware x14',
        'Latitude'
    ],
    'Lenovo': [
        'IdeaPad Slim 3', 'IdeaPad Slim 5', 'IdeaPad Flex 5', 'IdeaPad Gaming 3',
        'Yoga Slim 7', 'Yoga 9i', 'Yoga 7i',
        'ThinkPad E14', 'ThinkPad X1 Carbon', 'ThinkBook 15',
        'Legion 5', 'Legion 5 Pro', 'Legion Slim 7', 'LOQ'
    ],
    'Asus': [
        'VivoBook 15', 'VivoBook 16', 'VivoBook S15', 'VivoBook Go',
        'ZenBook 14', 'ZenBook Duo', 'ZenBook S13',
        'TUF Gaming F15', 'TUF Gaming A15',
        'ROG Strix G15', 'ROG Zephyrus G14'
    ],
    'Acer': [
        'Aspire 5', 'Aspire 3', 'Swift Go', 'Swift 3',
        'Nitro 5', 'Nitro V', 'Predator Helios'
    ],
    'Apple (MacBook)': [
        'MacBook Air M3', 'MacBook Air M2', 'MacBook Air M1',
        'MacBook Pro 14 M3', 'MacBook Pro 16 M3',
        'MacBook Pro M2', 'MacBook Pro M1'
    ]
};
