export const BRAND_CATEGORIES = [
    {
        name: 'Apple Devices',
        brands: ['Apple iPhone', 'Apple iPad', 'Apple Watch', 'Apple MacBook', 'Apple iMac']
    },
    {
        name: 'Premium Smartphones',
        brands: ['Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Nothing Phone', 'Asus ROG Phone', 'Xiaomi', 'Realme', 'Oppo', 'Vivo', 'iQOO', 'Motorola']
    },
    {
        name: 'Budget Smartphones',
        brands: ['Redmi', 'Poco', 'Tecno', 'Infinix', 'Itel', 'Lava', 'Jio']
    },
    {
        name: 'Laptop Brands',
        brands: ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Razer', 'Microsoft Surface', 'Samsung Galaxy Book', 'LG Gram', 'Huawei MateBook', 'Avita', 'Gigabyte']
    },
    {
        name: 'Other Devices',
        brands: ['Smart Watch', 'Wireless Earbuds', 'Power Bank', 'Tablet', 'Gaming Console', 'Camera']
    }
];

export const REPAIR_PROBLEMS = [
    {
        category: '⚡ Power / Charging Problems',
        problems: [
            'Device Dead', 'No Power', 'Not Charging', 'Slow Charging',
            'Battery Draining Fast', 'Battery Not Holding Charge',
            'Charging Port Loose / Damaged', 'Sudden Shutdown', 'Overheating'
        ]
    },
    {
        category: '🖥️ Display / Screen Problems',
        problems: [
            'No Display', 'Black Screen', 'White Screen', 'Broken Screen',
            'Touch Not Working', 'Lines on Display', 'Flickering Screen',
            'Dim Display', 'Display Spots'
        ]
    },
    {
        category: '🔊 Audio / Mic / Camera Problems',
        problems: [
            'Speaker Not Working', 'Low Sound', 'Mic Not Working',
            'Earpiece Not Working', 'Front Camera Not Working',
            'Rear Camera Not Working', 'Camera Blurry', 'Flash Not Working',
            'Webcam Not Working'
        ]
    },
    {
        category: '📡 Network / Connectivity Problems',
        problems: [
            'No Network', 'No SIM Detected', 'Signal Dropping',
            'WiFi Not Working', 'Bluetooth Not Working', 'GPS Not Working',
            'Hotspot Not Working', 'USB Not Working', 'HDMI Not Working',
            'LAN Not Working'
        ]
    },
    {
        category: '⌨️ Input Device Problems',
        problems: [
            'Keyboard Not Working', 'Some Keys Not Working', 'Touchpad Not Working',
            'Mouse Not Working', 'Power Button Not Working',
            'Volume Button Not Working', 'Fingerprint Not Working',
            'Face Unlock Not Working'
        ]
    },
    {
        category: '🧠 Software / OS Problems',
        problems: [
            'Software Crash', 'OS Not Booting', 'Boot Loop', 'Stuck on Logo',
            'Virus / Malware', 'Forgot Password / Pattern Lock', 'FRP Lock',
            'Windows Error / Blue Screen', 'OS Update Failed',
            'Storage Full Error', 'Data Recovery Required'
        ]
    },
    {
        category: '🧊 Performance / Hardware Problems',
        problems: [
            'Device Hanging / Slow', 'RAM Issue', 'Storage Not Detected',
            'SSD / HDD Failure', 'Motherboard Problem', 'IC Failure',
            'Fan Noise', 'Heating Issue', 'Liquid / Water Damage',
            'Physical Damage'
        ]
    }
];

export const DEVICE_BRANDS = [
    {
        category: 'Mobile Brands',
        brands: [
            'Samsung', 'Apple', 'Xiaomi', 'Redmi', 'Poco', 'Vivo', 'Oppo', 'Realme',
            'OnePlus', 'iQOO', 'Motorola', 'Nokia', 'Infinix', 'Tecno', 'Itel',
            'Lava', 'Micromax', 'Google', 'Sony', 'Asus', 'Lenovo', 'Honor',
            'Huawei', 'Nothing', 'Jio', 'Karbonn', 'Gionee', 'Panasonic',
            'Coolpad', 'Meizu'
        ]
    },
    {
        category: 'Laptop Brands',
        brands: [
            'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI', 'Samsung',
            'LG', 'Microsoft', 'Razer', 'Toshiba', 'Fujitsu', 'Huawei', 'Honor',
            'iBall', 'Lava', 'Micromax', 'Infinix', 'Jio', 'Avita', 'Chuwi',
            'Vaio', 'Zebronics', 'HCL'
        ]
    }
];

export const SPARE_PARTS = [
    {
        category: '🖥️ Display & Body Parts',
        parts: [
            'Display Screen', 'Touch Screen / Digitizer', 'Display Glass', 'Back Glass',
            'Screen Bezel', 'Front Frame', 'Middle Frame', 'Back Panel / Rear Housing',
            'Top Cover', 'Bottom Cover', 'Palm Rest', 'Hinges Set'
        ]
    },
    {
        category: '🔋 Power & Charging',
        parts: [
            'Battery', 'Adapter / Charger', 'Charging Port / DC Jack', 'Charging IC',
            'Power IC', 'Power Button', 'Volume Button', 'Flex Cable',
            'Power Button Flex', 'Vibration Motor', 'CMOS Battery'
        ]
    },
    {
        category: '🔊 Audio / Sensors / Camera',
        parts: [
            'Loud Speaker', 'Earpiece Speaker', 'Microphone', 'Front Camera',
            'Rear Camera', 'Camera Lens / Glass', 'Flash Light', 'Proximity Sensor',
            'Light Sensor', 'Fingerprint Sensor', 'Face ID Sensor', 'IR Sensor', 'Webcam'
        ]
    },
    {
        category: '🧠 Core Hardware & Chips',
        parts: [
            'Motherboard / Mainboard', 'CPU / Processor', 'RAM', 'Storage (SSD / HDD / Flash IC)',
            'BIOS IC', 'Audio IC', 'Network IC', 'WiFi IC', 'Bluetooth IC',
            'Power Amplifier IC', 'Baseband IC', 'RF IC'
        ]
    },
    {
        category: '❄️ Cooling System',
        parts: [
            'Cooling Fan', 'Heatsink', 'Thermal Paste'
        ]
    },
    {
        category: '🔌 Ports & Connectors',
        parts: [
            'USB Port', 'HDMI Port', 'LAN Port', 'SIM Tray', 'SIM Socket',
            'Memory Card Slot', 'Antenna Cable', 'LCD Connector', 'Display Cable',
            'Camera Cable', 'Touchpad Cable', 'Sub Board', 'Main Flex Cable'
        ]
    },
    {
        category: '⌨️ Input Devices & Small Parts',
        parts: [
            'Keyboard', 'Touchpad', 'Side Keys', 'Screw Set', 'Rubber Feet',
            'Mesh / Dust Net', 'RTC Battery', 'Speaker Grill', 'Button Strip',
            'Heat Pipe', 'Gasket / Adhesive'
        ]
    }
];

export const MOBILE_MODELS = [
    // Apple
    'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
    'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
    'iPhone X', 'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 8', 'iPhone 8 Plus', 'iPhone 7', 'iPhone 7 Plus',
    'iPhone SE (3rd Gen)', 'iPhone SE (2nd Gen)',

    // Samsung
    'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
    'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
    'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
    'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy S21 FE',
    'Galaxy Z Fold 6', 'Galaxy Z Flip 6', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
    'Galaxy A55', 'Galaxy A35', 'Galaxy A54', 'Galaxy A34', 'Galaxy A15', 'Galaxy A14',
    'Galaxy M55', 'Galaxy M34', 'Galaxy M14', 'Galaxy F54', 'Galaxy F34',

    // Xiaomi / Redmi / Poco
    'Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Xiaomi 13',
    'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
    'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
    'Redmi 13C', 'Redmi 12 5G', 'Redmi 12C',
    'Poco F6', 'Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco C65',

    // OnePlus
    'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus 10 Pro',
    'OnePlus Nord 4', 'OnePlus Nord CE 4', 'OnePlus Nord 3', 'OnePlus Nord CE 3 Lite',

    // Realme
    'Realme GT 6', 'Realme GT 6T', 'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12x',
    'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 11x', 'Realme C67', 'Realme C53', 'Realme C55',

    // Vivo / iQOO
    'Vivo X100 Pro', 'Vivo X100', 'Vivo V30 Pro', 'Vivo V30', 'Vivo T3', 'Vivo Y200',
    'iQOO 12', 'iQOO Neo 9 Pro', 'iQOO Z9', 'iQOO Z7 Pro',

    // Oppo
    'Oppo Find X7 Ultra', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo F25 Pro', 'Oppo A79', 'Oppo A59',

    // Google
    'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9',
    'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
    'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
    'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a'
];
