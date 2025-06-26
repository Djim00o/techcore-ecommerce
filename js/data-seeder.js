/**
 * TechCore Data Seeder
 * Seeds the database with realistic product data
 */
class DataSeeder {
    constructor() {
        this.apiClient = apiClient;
    }

    async seedProducts() {
        console.log('🌱 Starting product seeding...');
        
        const products = [
            // Graphics Cards
            {
                name: 'NVIDIA GeForce RTX 4090',
                slug: 'nvidia-geforce-rtx-4090',
                shortDescription: 'Ultimate gaming graphics card with 24GB GDDR6X',
                description: 'The most powerful consumer graphics card ever created, featuring the Ada Lovelace architecture with 24GB of GDDR6X memory for unparalleled 4K gaming and content creation performance.',
                category: 'graphics-cards',
                brand: 'NVIDIA',
                sku: 'RTX4090-24GB',
                price: 1599.99,
                originalPrice: 1699.99,
                stock: 15,
                featured: true,
                onSale: true,
                specifications: [
                    { name: 'GPU', value: 'AD102' },
                    { name: 'CUDA Cores', value: '16,384' },
                    { name: 'Memory', value: '24GB GDDR6X' },
                    { name: 'Memory Bus', value: '384-bit' },
                    { name: 'Base Clock', value: '2230 MHz' },
                    { name: 'Boost Clock', value: '2520 MHz' },
                    { name: 'TDP', value: '450W' },
                    { name: 'Outputs', value: '3x DisplayPort 1.4a, 1x HDMI 2.1' }
                ],
                features: [
                    'Ray Tracing 3rd Gen',
                    'DLSS 3 with Frame Generation',
                    'AV1 Encoding',
                    'PCIe 4.0 Support',
                    'NVIDIA Broadcast'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
                        alt: 'NVIDIA GeForce RTX 4090 Graphics Card',
                        isPrimary: true
                    }
                ],
                tags: ['rtx', '4090', 'ray-tracing', 'dlss', 'gaming', '4k']
            },
            {
                name: 'AMD Radeon RX 7900 XTX',
                slug: 'amd-radeon-rx-7900-xtx',
                shortDescription: 'High-performance RDNA 3 graphics card with 24GB GDDR6',
                description: 'AMD\'s flagship graphics card featuring RDNA 3 architecture, 24GB of GDDR6 memory, and exceptional performance for 4K gaming and content creation.',
                category: 'graphics-cards',
                brand: 'AMD',
                sku: 'RX7900XTX-24GB',
                price: 999.99,
                stock: 20,
                featured: true,
                specifications: [
                    { name: 'GPU', value: 'Navi 31' },
                    { name: 'Stream Processors', value: '6,144' },
                    { name: 'Memory', value: '24GB GDDR6' },
                    { name: 'Memory Bus', value: '384-bit' },
                    { name: 'Base Clock', value: '1855 MHz' },
                    { name: 'Boost Clock', value: '2500 MHz' },
                    { name: 'TDP', value: '355W' },
                    { name: 'Outputs', value: '2x DisplayPort 2.1, 2x HDMI 2.1' }
                ],
                features: [
                    'RDNA 3 Architecture',
                    'Hardware Ray Tracing',
                    'FSR 3 Support',
                    'AV1 Encoding/Decoding',
                    'AMD Smart Access Memory'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800',
                        alt: 'AMD Radeon RX 7900 XTX Graphics Card',
                        isPrimary: true
                    }
                ],
                tags: ['amd', 'rdna3', 'ray-tracing', 'fsr', 'gaming']
            },
            {
                name: 'NVIDIA GeForce RTX 4070',
                slug: 'nvidia-geforce-rtx-4070',
                shortDescription: 'Excellent 1440p gaming performance with 12GB GDDR6X',
                description: 'Perfect balance of performance and value for 1440p gaming, featuring 12GB of GDDR6X memory and all the latest NVIDIA technologies.',
                category: 'graphics-cards',
                brand: 'NVIDIA',
                sku: 'RTX4070-12GB',
                price: 599.99,
                stock: 30,
                featured: true,
                specifications: [
                    { name: 'GPU', value: 'AD104' },
                    { name: 'CUDA Cores', value: '5,888' },
                    { name: 'Memory', value: '12GB GDDR6X' },
                    { name: 'Memory Bus', value: '192-bit' },
                    { name: 'Base Clock', value: '1920 MHz' },
                    { name: 'Boost Clock', value: '2475 MHz' },
                    { name: 'TDP', value: '200W' },
                    { name: 'Outputs', value: '3x DisplayPort 1.4a, 1x HDMI 2.1' }
                ],
                features: [
                    'Ray Tracing 3rd Gen',
                    'DLSS 3',
                    'AV1 Encoding',
                    'PCIe 4.0 Support',
                    'NVIDIA Reflex'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
                        alt: 'NVIDIA GeForce RTX 4070 Graphics Card',
                        isPrimary: true
                    }
                ],
                tags: ['rtx', '4070', '1440p', 'dlss', 'gaming']
            },

            // Processors
            {
                name: 'Intel Core i9-13900K',
                slug: 'intel-core-i9-13900k',
                shortDescription: '24-core flagship processor with hybrid architecture',
                description: 'Intel\'s most powerful consumer processor featuring 24 cores (8P+16E) with hybrid architecture for exceptional gaming and productivity performance.',
                category: 'processors',
                brand: 'Intel',
                sku: 'BX8071513900K',
                price: 589.99,
                originalPrice: 629.99,
                stock: 25,
                featured: true,
                onSale: true,
                specifications: [
                    { name: 'Cores', value: '24 (8P+16E)' },
                    { name: 'Threads', value: '32' },
                    { name: 'Base Clock', value: '3.0 GHz' },
                    { name: 'Max Boost', value: '5.8 GHz' },
                    { name: 'Cache', value: '36MB L3' },
                    { name: 'TDP', value: '125W' },
                    { name: 'Socket', value: 'LGA1700' },
                    { name: 'Memory Support', value: 'DDR5-5600, DDR4-3200' }
                ],
                features: [
                    'Hybrid Architecture',
                    'Intel Thread Director',
                    'PCIe 5.0 Support',
                    'Integrated Graphics',
                    'Overclocking Support'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800',
                        alt: 'Intel Core i9-13900K Processor',
                        isPrimary: true
                    }
                ],
                tags: ['intel', 'i9', '13th-gen', 'gaming', 'productivity']
            },
            {
                name: 'AMD Ryzen 9 7900X',
                slug: 'amd-ryzen-9-7900x',
                shortDescription: '12-core Zen 4 processor with exceptional performance',
                description: 'High-performance 12-core processor built on the advanced Zen 4 architecture with 5nm process technology for gaming and content creation.',
                category: 'processors',
                brand: 'AMD',
                sku: '100-100000589WOF',
                price: 429.99,
                stock: 20,
                featured: true,
                specifications: [
                    { name: 'Cores', value: '12' },
                    { name: 'Threads', value: '24' },
                    { name: 'Base Clock', value: '4.7 GHz' },
                    { name: 'Max Boost', value: '5.6 GHz' },
                    { name: 'Cache', value: '76MB Total' },
                    { name: 'TDP', value: '170W' },
                    { name: 'Socket', value: 'AM5' },
                    { name: 'Memory Support', value: 'DDR5-5200' }
                ],
                features: [
                    'Zen 4 Architecture',
                    '5nm Process',
                    'PCIe 5.0 Support',
                    'Integrated RDNA 2 Graphics',
                    'Precision Boost 2'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
                        alt: 'AMD Ryzen 9 7900X Processor',
                        isPrimary: true
                    }
                ],
                tags: ['amd', 'ryzen', 'zen4', 'am5', 'gaming']
            },

            // Motherboards
            {
                name: 'ASUS ROG Maximus Z790 Hero',
                slug: 'asus-rog-maximus-z790-hero',
                shortDescription: 'Premium Z790 motherboard for Intel 13th gen processors',
                description: 'High-end motherboard featuring robust power delivery, advanced cooling, and comprehensive connectivity for enthusiast builds.',
                category: 'motherboards',
                brand: 'ASUS',
                sku: 'ROG-MAXIMUS-Z790-HERO',
                price: 629.99,
                stock: 15,
                featured: true,
                specifications: [
                    { name: 'Socket', value: 'LGA1700' },
                    { name: 'Chipset', value: 'Intel Z790' },
                    { name: 'Memory', value: 'DDR5-7800+ (OC)' },
                    { name: 'Memory Slots', value: '4 x DIMM' },
                    { name: 'Expansion Slots', value: '2 x PCIe 5.0 x16, 1 x PCIe 4.0 x16' },
                    { name: 'Storage', value: '4 x M.2, 6 x SATA' },
                    { name: 'USB Ports', value: '12 x USB 3.2, 2 x USB4' },
                    { name: 'Form Factor', value: 'ATX' }
                ],
                features: [
                    'ROG SupremeFX Audio',
                    'WiFi 6E',
                    '2.5Gb Ethernet',
                    'Aura Sync RGB',
                    'AI Overclocking'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800',
                        alt: 'ASUS ROG Maximus Z790 Hero Motherboard',
                        isPrimary: true
                    }
                ],
                tags: ['asus', 'z790', 'ddr5', 'wifi6e', 'rgb']
            },

            // Memory
            {
                name: 'Corsair Vengeance DDR5-5600 32GB Kit',
                slug: 'corsair-vengeance-ddr5-5600-32gb-kit',
                shortDescription: 'High-performance DDR5 memory kit with RGB lighting',
                description: 'Premium DDR5 memory kit optimized for Intel and AMD platforms with stunning RGB lighting and exceptional performance.',
                category: 'memory',
                brand: 'Corsair',
                sku: 'CMH32GX5M2B5600C36',
                price: 179.99,
                originalPrice: 199.99,
                stock: 40,
                featured: true,
                onSale: true,
                specifications: [
                    { name: 'Capacity', value: '32GB (2 x 16GB)' },
                    { name: 'Speed', value: 'DDR5-5600' },
                    { name: 'Latency', value: 'CL36-36-36-76' },
                    { name: 'Voltage', value: '1.25V' },
                    { name: 'Form Factor', value: 'DIMM' },
                    { name: 'Heat Spreader', value: 'Aluminum' }
                ],
                features: [
                    'Intel XMP 3.0',
                    'AMD EXPO',
                    'RGB Lighting',
                    'Custom Performance PCB',
                    'Tight Response Times'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=800',
                        alt: 'Corsair Vengeance DDR5 Memory Kit',
                        isPrimary: true
                    }
                ],
                tags: ['ddr5', 'rgb', 'gaming', 'overclocking', 'high-capacity']
            },

            // Storage
            {
                name: 'Samsung 980 PRO 2TB NVMe SSD',
                slug: 'samsung-980-pro-2tb-nvme-ssd',
                shortDescription: 'PCIe 4.0 NVMe SSD with exceptional performance',
                description: 'Professional-grade SSD with PCIe 4.0 interface delivering maximum performance for gaming and content creation.',
                category: 'storage',
                brand: 'Samsung',
                sku: 'MZ-V8P2T0BW',
                price: 199.99,
                originalPrice: 249.99,
                stock: 35,
                featured: true,
                onSale: true,
                specifications: [
                    { name: 'Capacity', value: '2TB' },
                    { name: 'Interface', value: 'PCIe 4.0 x4, NVMe 1.3c' },
                    { name: 'Form Factor', value: 'M.2 2280' },
                    { name: 'Sequential Read', value: 'Up to 7,000 MB/s' },
                    { name: 'Sequential Write', value: 'Up to 5,100 MB/s' },
                    { name: 'Random Read', value: 'Up to 1,000K IOPS' },
                    { name: 'Random Write', value: 'Up to 1,000K IOPS' },
                    { name: 'Endurance', value: '1,200 TBW' }
                ],
                features: [
                    'Samsung V-NAND Technology',
                    'Dynamic Thermal Guard',
                    'Samsung Magician Software',
                    '5-Year Limited Warranty',
                    'AES 256-bit Encryption'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',
                        alt: 'Samsung 980 PRO NVMe SSD',
                        isPrimary: true
                    }
                ],
                tags: ['nvme', 'pcie4', 'high-speed', 'gaming', 'content-creation']
            },

            // Cooling
            {
                name: 'Noctua NH-D15 CPU Cooler',
                slug: 'noctua-nh-d15-cpu-cooler',
                shortDescription: 'Premium dual-tower CPU cooler with exceptional performance',
                description: 'World-renowned air cooler with dual towers and premium fans for silent operation and maximum cooling performance.',
                category: 'cooling',
                brand: 'Noctua',
                sku: 'NH-D15-COOLER',
                price: 109.99,
                stock: 25,
                featured: true,
                specifications: [
                    { name: 'Type', value: 'Dual Tower Air Cooler' },
                    { name: 'Socket Support', value: 'Intel LGA1700, AM5, AM4' },
                    { name: 'Fans', value: '2x NF-A15 PWM 140mm' },
                    { name: 'Fan Speed', value: '300-1500 RPM' },
                    { name: 'Noise Level', value: '19.2-24.6 dB(A)' },
                    { name: 'Height', value: '165mm' },
                    { name: 'TDP Rating', value: '250W+' }
                ],
                features: [
                    'Premium PWM Fans',
                    'SecuFirm2 Mounting',
                    '6-Year Warranty',
                    'Low-Noise Operation',
                    'Easy Installation'
                ],
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
                        alt: 'Noctua NH-D15 CPU Cooler',
                        isPrimary: true
                    }
                ],
                tags: ['air-cooling', 'quiet', 'premium', 'high-performance']
            }
        ];

        try {
            for (const product of products) {
                try {
                    const response = await this.createProduct(product);
                    if (response.success) {
                        console.log(`✅ Created product: ${product.name}`);
                    } else {
                        console.log(`⚠️ Product may already exist: ${product.name}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Skipping ${product.name}: ${error.message}`);
                }
            }
            console.log('🎉 Product seeding completed!');
            return true;
        } catch (error) {
            console.error('❌ Product seeding failed:', error);
            return false;
        }
    }

    async createProduct(productData) {
        return await this.apiClient.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async seedCategories() {
        console.log('🏷️ Starting category seeding...');
        
        const categories = [
            {
                name: 'Graphics Cards',
                slug: 'graphics-cards',
                description: 'High-performance GPUs for gaming and content creation',
                icon: 'fas fa-tv',
                featured: true,
                metaDescription: 'Shop the latest graphics cards from NVIDIA and AMD'
            },
            {
                name: 'Processors',
                slug: 'processors',
                description: 'Latest CPUs from Intel and AMD',
                icon: 'fas fa-microchip',
                featured: true,
                metaDescription: 'Find the perfect processor for gaming and productivity'
            },
            {
                name: 'Motherboards',
                slug: 'motherboards',
                description: 'Reliable boards for every build',
                icon: 'fas fa-memory',
                featured: true,
                metaDescription: 'Quality motherboards for Intel and AMD systems'
            },
            {
                name: 'Memory',
                slug: 'memory',
                description: 'Fast DDR4 and DDR5 memory modules',
                icon: 'fas fa-save',
                featured: true,
                metaDescription: 'High-speed RAM for gaming and professional use'
            },
            {
                name: 'Storage',
                slug: 'storage',
                description: 'SSDs and HDDs for all your data needs',
                icon: 'fas fa-hdd',
                featured: true,
                metaDescription: 'Fast SSDs and reliable HDDs for storage solutions'
            },
            {
                name: 'Cooling',
                slug: 'cooling',
                description: 'Keep your system running cool and quiet',
                icon: 'fas fa-fan',
                featured: true,
                metaDescription: 'Air and liquid cooling solutions for optimal temperatures'
            }
        ];

        try {
            for (const category of categories) {
                try {
                    await this.apiClient.request('/categories', {
                        method: 'POST',
                        body: JSON.stringify(category)
                    });
                    console.log(`✅ Created category: ${category.name}`);
                } catch (error) {
                    console.log(`⚠️ Category may already exist: ${category.name}`);
                }
            }
            console.log('🎉 Category seeding completed!');
            return true;
        } catch (error) {
            console.error('❌ Category seeding failed:', error);
            return false;
        }
    }

    async seedAll() {
        console.log('🌱 Starting complete database seeding...');
        
        try {
            await this.seedCategories();
            await this.seedProducts();
            
            console.log('🎉 Database seeding completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
            return false;
        }
    }
}

// Global seeder instance
window.dataSeeder = new DataSeeder(); 