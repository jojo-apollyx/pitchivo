person lead

{
  "_id": {
    "$oid": "683cd8fdac50166c77d7d9b0"
  },
  "first_name": "Gry",
  "last_name": "Svalheim",
  "full_name": "Gry Svalheim",
  "email": "gry.svalheim@rimfrostkrill.com",
  "phone": "+47 478 54 267",
  "title": "Senior Vice President - Human Nutrition",
  "department": "Sales, Marketing and R&D",
  "role": "Senior Leadership",
  "seniority_level": "Senior",
  "linkedin_url": null,
  "twitter_url": null,
  "company": {
    "$ref": "CompanyLead",
    "$id": {
      "$oid": "683cd8f7ac50166c77d7d9a6"
    }
  },
  "lead_source": "Web Scraping",
  "source_url": "https://www.rimfrostkrill.com/contact",
  "is_likely_to_engage": null,
  "email_status": "pending",
  "is_active": true,
  "metadata": {
    "extracted_from_crawl": true,
    "refined_with_4o": true,
    "source_url": "https://www.rimfrostkrill.com/contact",
    "confidence_score": 0.9
  },
  "created_at": {
    "$date": "2025-06-01T22:49:33.002Z"
  },
  "updated_at": {
    "$date": "2025-06-01T22:49:33.002Z"
  },
  "last_contacted_at": null
}

product lead
{
  "_id": {
    "$oid": "683b6b3069afc11c0f8c95f5"
  },
  "name": "MitoCarn™ Heart",
  "description": "MitoCarn™ Heart supports healthy mitochondrial function in heart cells by maintaining L-Carnitine levels, aiding ATP energy production, and reducing oxidative stress through antioxidant activity. It is a 100% active L-Carnitine compound suitable for liquid, gelcap, capsule, tablet, gummy, and powder formulations.",
  "company": {
    "$ref": "CompanyLead",
    "$id": {
      "$oid": "683b0ba9be0b38fac991e8f6"
    }
  },
  "ingredient": {
    "$ref": "Ingredient",
    "$id": {
      "$oid": "66a21433fee5da0a2585a25d"
    }
  },
  "ingredient_base_name": "L-Carnitine",
  "form": null,
  "concentration": null,
  "processing_method": null,
  "grade": "Nutritional Grade",
  "name_aliases": [
    "MitoCarn Heart",
    "L-Carnitine Heart",
    "MitoCarn™"
  ],
  "categories": [
    "Food & Nutrition",
    "Nutrition & Well-being",
    "Sports Nutrition"
  ],
  "applications": [
    "Cardiovascular Health",
    "Energy Support",
    "Antioxidant Support"
  ],
  "end_uses": [
    "Heart Health Supplements",
    "Energy Boosting Formulations",
    "Antioxidant Products"
  ],
  "specifications": {
    "country_of_origin": null,
    "appearance": null,
    "form": null,
    "color": null,
    "odor": null,
    "shelf_life_months": null,
    "storage": null
  },
  "certifications": [],
  "pricing_info": null,
  "availability_regions": [],
  "is_ingredient": true,
  "is_finished_product": false,
  "analyzed_ingredients": [
    "L-Carnitine"
  ],
  "is_active": false,
  "metadata": {
    "migrated_from_seller_ingredient": true,
    "original_product_id": 300103,
    "supplier_name": "Mitocarn"
  },
  "created_at": {
    "$date": "2025-05-31T20:48:48.104Z"
  },
  "updated_at": {
    "$date": "2025-05-31T20:48:48.104Z"
  },
  "last_updated_from_source": null
}

purchase lead

{
  "_id": {
    "$oid": "68776ad83ac233fa7cfa1fc4"
  },
  "applications": [
    "Dietary Supplements",
    "Functional Foods",
    "Food Fortification"
  ],
  "buyer_company": {
    "$ref": "CompanyLead",
    "$id": {
      "$oid": "6847b67f38aa828168bab96e"
    }
  },
  "categories": [
    "Digestive Health",
    "Food & Beverage ingredients"
  ],
  "concentration": "10000",
  "concentration_unit": "ppm",
  "created_at": {
    "$date": "2025-07-16T09:03:20.741Z"
  },
  "currency": "USD",
  "end_uses": [],
  "form": "Extract",
  "grade": null,
  "ingredient_base_name": "Garlic Extract",
  "is_active": true,
  "metadata": {
    "extracted_from_sales_orders": true,
    "source_file": "Processed_Sales_Orders.xlsx",
    "normalized_name": "deodorizedgarlicextract1allicin10000ppm25kgdrumbytrg",
    "raw_concentration": "1% Allicin (10,000 ppm)",
    "package_info": {
      "size": "25 kg",
      "container": "drum",
      "full_description": "25 kg drum"
    },
    "supplier_info": {
      "name": "TRG",
      "brand": "TRG"
    },
    "additional_details": {
      "purity_level": "",
      "processing_notes": "deodorized for improved palatability",
      "target_market": "supplement manufacturers"
    },
    "original_ingredient_analysis": {
      "base_name": "Garlic Extract",
      "form": null,
      "processing_method": "Deodorized",
      "grade": null,
      "concentration": "1% Allicin (10,000 ppm)"
    },
    "enhanced_ai_analysis": {
      "product_variant": "",
      "product_source": "Natural, Plant-based",
      "concentration": {
        "normalized_value": "10000",
        "unit": "PPM",
        "raw_value": "1% Allicin (10,000 ppm)"
      },
      "grade": "",
      "processing_method": "Deodorized",
      "form": "Extract",
      "categories": [
        "Digestive Health",
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Dietary Supplements",
        "Functional Foods",
        "Food Fortification"
      ],
      "package_info": {
        "size": "25 kg",
        "container": "drum",
        "full_description": "25 kg drum"
      },
      "supplier_info": {
        "name": "TRG",
        "brand": "TRG"
      },
      "additional_details": {
        "purity_level": "",
        "processing_notes": "deodorized for improved palatability",
        "target_market": "supplement manufacturers"
      }
    }
  },
  "name_aliases": [
    "Allium Sativum Extract"
  ],
  "processing_method": "Deodorized",
  "product_description": "Purchase transaction: Garlic Extract",
  "product_name": "(Deodorized) Garlic Extract 1% Allicin  (10,000 ppm) 25 kg drum by TRG",
  "product_source": "Natural, Plant-based",
  "product_variant": "",
  "purchase_date": {
    "$date": "2023-03-01T00:00:00.000Z"
  },
  "quantity": null,
  "total_amount": null,
  "unit_price": null,
  "unit_type": null,
  "updated_at": {
    "$date": "2025-07-16T09:03:20.741Z"
  }
}

company lead

{
  "_id": {
    "$oid": "683ae420be0b38fac991e51a"
  },
  "name": "Catania Oils",
  "slug": "catania-oils",
  "logo_url": "https://tovvistorage.blob.core.windows.net/company-image/catania-oils/company_logo_987d5f59-241a-4989-845d-75ddcdc78a88.webp",
  "website_url": "https://cataniaoils.com/",
  "description": "Catania Oils is a leading provider of conventional, Non-GMO Project verified, and organic oils to the ingredients, foodservice, and retail markets. With a global sourcing network and state-of-the-art lab, they ensure high-quality oils and support customers in managing commodity risks.",
  "company_type": "Ingredient Manufacturer",
  "categories": [
    "Oils",
    "Ingredients",
    "Foodservice",
    "Retail"
  ],
  "industries": [
    "Food & Beverage",
    "Nutrition",
    "Nutraceuticals"
  ],
  "address": {
    "street": null,
    "city": null,
    "state": null,
    "country": "United States",
    "postal_code": null,
    "raw_address": null
  },
  "phone": "+1 978-772-7900",
  "email": "customerservice@cataniaoils.com",
  "established_year": 1900,
  "estimated_employees": 5000,
  "annual_revenue": null,
  "certifications": [],
  "regulatory_compliance": [],
  "linkedin_url": "https://www.linkedin.com/company/catania-spagna/mycompany/verification/",
  "social_media": [
    "https://cataniaoils.com/",
    "https://www.facebook.com/cataniaoils",
    "https://www.linkedin.com/company/catania-spagna/mycompany/verification/"
  ],
  "products": [
    {
      "name": "Catania Oils Grapeseed Oil, Expeller Pressed",
      "description": "Grapeseed oil is a versatile ingredient used in the food industry as a gourmet cooking oil due to its high heat stability. It is also utilized in the pharmaceutical industry.",
      "ingredient_base_name": "Grapeseed Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Expeller Pressed",
      "grade": "Food Grade",
      "name_alias": "Grapeseed Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Pharmaceutical Ingredients"
      ],
      "applications": [
        "Cooking Oil",
        "Pharmaceutical Formulations"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407713,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Palm Shortening",
      "description": "Palm Shortening is commonly used in shortenings, margarines, spreads, cookies, cakes, frostings, pie crusts, and frying. It also has applications in the cosmetic and pharmaceutical industries.",
      "ingredient_base_name": "Palm Shortening",
      "form": null,
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Palm Oil Shortening",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Bakery",
        "Confectionery",
        "Cosmetics",
        "Pharmaceutical"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407719,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Almond Oil, Refined",
      "description": "Almond oil is used in the culinary industry as gourmet cooking oil. It is also one of the most versatile multipurpose skin and hair care base oils available for the cosmetic industry.",
      "ingredient_base_name": "Almond Oil",
      "form": "Oil",
      "concentration": null,
      "processing_method": "Refined",
      "grade": "Food Grade",
      "name_alias": "Refined Almond Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Culinary",
        "Cosmetics",
        "Hair Care",
        "Skin Care"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407700,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Shea Butter",
      "description": "Shea butter is widely used in soap making, pharmaceuticals, and cosmetics. Its high cinnamic acid content provides healing properties for the skin, while its unsaponifiable content offers soothing and extra sun protection benefits.",
      "ingredient_base_name": "Shea Butter",
      "form": null,
      "concentration": null,
      "processing_method": null,
      "grade": "Cosmetic Grade",
      "name_alias": "Karite Butter",
      "product_certifications": [],
      "categories": [
        "Beauty & Anti-aging",
        "Pharmaceutical ingredients",
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Cosmetics",
        "Pharmaceuticals",
        "Soap Making"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407726,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Walnut Oil, Refined",
      "description": "Refined walnut oil suitable for food and beverage applications.",
      "ingredient_base_name": "Walnut Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined",
      "grade": "Food Grade",
      "name_alias": "Refined Walnut Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Food & Beverage"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407732,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Coconut Oil, 76 Degrees",
      "description": "Coconut oil is widely used in the food industry for cooking, frying, baked goods, confections, and ice cream coatings. It also serves as an ingredient in the cosmetic industry for soaps, skin moisturizers, and tanning lotions.",
      "ingredient_base_name": "Coconut Oil",
      "form": "Oil",
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Coconut Oil 76 Degrees",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking",
        "Frying",
        "Baking",
        "Cosmetics"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407708,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Macadamia Nut Oil, Refined",
      "description": "Macadamia Nut Oil is a versatile oil used in the food industry for dressings and light sautéing due to its mild buttery flavor, high monounsaturated fat content, long shelf stability, and high smoke point. It is also widely used in the cosmetic industry for body lotions, skin creams, massage oils, and sun care formulations due to its excellent skin absorption properties.",
      "ingredient_base_name": "Macadamia Nut Oil",
      "form": "Oil",
      "concentration": null,
      "processing_method": "Refined",
      "grade": "Food Grade",
      "name_alias": "Macadamia Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Culinary Applications",
        "Cosmetic Formulations"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407715,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Palm Shortening - Organic",
      "description": "Organic Palm Oil is a versatile ingredient widely used in the food industry for shortenings, margarines, spreads, cookies, cakes, frostings, pie crusts, and frying. It also finds applications in the cosmetic and pharmaceutical industries.",
      "ingredient_base_name": "Palm Oil",
      "form": "Shortening",
      "concentration": null,
      "processing_method": null,
      "grade": "Organic",
      "name_alias": "Organic Palm Shortening",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Food Industry",
        "Cosmetics",
        "Pharmaceuticals"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407720,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Extra Virgin Olive Oil - Organic",
      "description": "Organic Extra Virgin Olive Oil is used as a food condiment, in salad dressings, and for sautéing. It is safe as a lubricant for kitchen machinery such as grinders, blenders, and cookware. It is also used for its medicinal attributes and is rich in monounsaturated fats.",
      "ingredient_base_name": "Olive Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Cold Pressed",
      "grade": "Food Grade",
      "name_alias": "EVOO",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Culinary Applications",
        "Food Condiments",
        "Health & Wellness"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407712,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Sesame Oil - Organic",
      "description": "Organic sesame oil from Catania Oils, suitable for food and beverage applications.",
      "ingredient_base_name": "Sesame Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Organic Sesame Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Food & Beverage",
        "Cooking Oil",
        "Dressing"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407722,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Coconut Oil, RBD - Organic",
      "description": "Organic Coconut Oil is widely used in the food industry for cooking, frying, baked goods, confections, and ice cream coatings. It also serves as an ingredient in the cosmetic industry for soaps, skin moisturizers, and tanning lotions.",
      "ingredient_base_name": "Coconut Oil",
      "form": "Oil",
      "concentration": null,
      "processing_method": "RBD (Refined, Bleached, Deodorized)",
      "grade": "Organic",
      "name_alias": "Organic Coconut Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking",
        "Frying",
        "Baking",
        "Cosmetics"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407711,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Shea Butter - Organic",
      "description": "Organic shea butter from Catania Oils, suitable for various food and beverage applications.",
      "ingredient_base_name": "Shea Butter",
      "form": null,
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Organic Shea Butter",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Food & Beverage",
        "Cosmetics",
        "Skin Care"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407727,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Apricot Kernel Oil",
      "description": "Apricot Kernel Oil has a deep, nutty flavor, making it excellent for desserts and recipes. It is also widely used in cosmetics as a moisturizer, cream, or hand soap.",
      "ingredient_base_name": "Apricot Kernel Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Apricot Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cosmetics",
        "Food & Beverage"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407701,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Soybean Oil, RBD - Organic",
      "description": "Soybean oil is widely used in the food industry as a cooking and frying oil, and as an ingredient in margarine, shortenings, salad dressings, mayonnaise, frozen foods, and commercially baked goods.",
      "ingredient_base_name": "Soybean Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "RBD (Refined, Bleached, Deodorized)",
      "grade": "Food Grade",
      "name_alias": "Organic Soybean Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Cooking Oil",
        "Frying Oil",
        "Food Processing"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407728,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Palm Oil, RBD",
      "description": "Palm Oil is a versatile oil widely used in the food industry for applications such as shortenings, margarines, spreads, cookies, cakes, frostings, pie crusts, and frying. It also finds use in the cosmetic and pharmaceutical industries.",
      "ingredient_base_name": "Palm Oil",
      "form": null,
      "concentration": null,
      "processing_method": "RBD (Refined, Bleached, Deodorized)",
      "grade": "Food Grade",
      "name_alias": "Refined Palm Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Food Industry",
        "Cosmetics",
        "Pharmaceuticals"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407718,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Canola Oil, RBD - Organic",
      "description": "Organic Canola Oil is a healthier oil with zero trans fat, healthy levels of monounsaturated and polyunsaturated fats, and the lowest level of saturated fats among common culinary oils. Widely used in the food industry for baking, frying, sautéing, and salad dressings, it also has industrial applications in lubricants, candles, cosmetics, inks, and biodiesel fuel production.",
      "ingredient_base_name": "Canola Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "RBD (Refined, Bleached, Deodorized)",
      "grade": "Organic",
      "name_alias": "Rapeseed Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Cooking Oil",
        "Food Processing",
        "Industrial Applications"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407706,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "High Oleic Sunflower Oil, RBWD - Organic",
      "description": "Organic high oleic sunflower oil, ideal for high-temperature cooking and recognized for its health benefits with lower trans fats. Also used in cosmetic formulations as an emollient.",
      "ingredient_base_name": "Sunflower Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined, Bleached, Winterized, Deodorized (RBWD)",
      "grade": "Food Grade",
      "name_alias": "Organic Sunflower Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking",
        "Cosmetic Formulations"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407730,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Argan Oil, RBD",
      "description": "Refined, bleached, and deodorized (RBD) Argan Oil suitable for various food and beverage applications.",
      "ingredient_base_name": "Argan Oil",
      "form": null,
      "concentration": null,
      "processing_method": "Refined, Bleached, Deodorized (RBD)",
      "grade": "Food Grade",
      "name_alias": "RBD Argan Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Food & Beverage",
        "Cooking Oils",
        "Nutritional Products"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407702,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Sesame Oil, RBDW",
      "description": "Sesame oil used in the food industry for cooking, baking, light frying, and salad dressings.",
      "ingredient_base_name": "Sesame Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined, Bleached, Deodorized (RBD)",
      "grade": "Food Grade",
      "name_alias": "RBD Sesame Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Cooking",
        "Baking",
        "Light Frying",
        "Salad Dressings"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407723,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils MCT Fractionated Coconut Oil",
      "description": "MCT Fractionated Coconut Oil by Catania Oils, suitable for food, beverage, and nutrition applications.",
      "ingredient_base_name": "MCT Fractionated Coconut Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Medium Chain Triglycerides Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Nutritional Supplements"
      ],
      "applications": [
        "Food & Beverage",
        "Nutritional Products",
        "Functional Foods"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407716,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Coconut Oil, 92 Degrees",
      "description": "Coconut oil is widely used in the food industry for cooking, frying, baked goods, confections, and ice cream coatings. It also finds applications in the cosmetic industry as an ingredient in soaps, skin moisturizers, and tanning lotions.",
      "ingredient_base_name": "Coconut Oil",
      "form": null,
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Coconut Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking",
        "Frying",
        "Baking",
        "Cosmetics"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407709,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Toasted Sesame Oil",
      "description": "Toasted sesame oil is commonly used in the food industry as a topping oil, sautéing oil, seasoning, and in sauces to impart a sesame flavor.",
      "ingredient_base_name": "Sesame Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Toasted",
      "grade": "Food Grade",
      "name_alias": "Toasted Sesame Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Food Industry",
        "Seasoning",
        "Sauces"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407724,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Toasted Sesame Oil - Organic",
      "description": "Organic toasted sesame oil, ideal for culinary applications and food manufacturing.",
      "ingredient_base_name": "Sesame Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Toasted",
      "grade": "Food Grade",
      "name_alias": "Organic Toasted Sesame Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage Ingredients"
      ],
      "applications": [
        "Culinary Applications",
        "Food Manufacturing",
        "Flavoring"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407725,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Avocado Oil, RBWD - Organic",
      "description": "Organic refined avocado oil, suitable for food and beverage applications.",
      "ingredient_base_name": "Avocado Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined",
      "grade": "Food Grade",
      "name_alias": "Organic Avocado Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Food & Beverage",
        "Cooking Oils",
        "Nutritional Supplements"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407704,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Avocado Oil, RBWD",
      "description": "Avocado oil is widely used in the cosmetic industry as a base for skin and body care products such as bath lotions, skin moisturizers, creams, and soaps. It is also utilized in the food industry for marinades and salad dressings.",
      "ingredient_base_name": "Avocado Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": null,
      "grade": "Food Grade",
      "name_alias": "Refined Avocado Oil",
      "product_certifications": [],
      "categories": [
        "Beauty & Anti-aging",
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Cosmetic formulations",
        "Food industry"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407703,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Linoleic Sunflower Oil, RBWD - Organic",
      "description": "Organic linoleic sunflower oil refined, bleached, and deodorized (RBWD), suitable for food and beverage applications.",
      "ingredient_base_name": "Sunflower Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined, Bleached, Deodorized (RBWD)",
      "grade": "Food Grade",
      "name_alias": "Linoleic Sunflower Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage ingredients"
      ],
      "applications": [
        "Food & Beverage",
        "Cooking Oil",
        "Bakery"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407731,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Extra Virgin Coconut Oil - Organic",
      "description": "Organic extra virgin coconut oil used in the food industry for cooking, frying, baked goods, confections, and ice cream coatings. Also utilized in cosmetics for soaps, skin moisturizers, and tanning lotions.",
      "ingredient_base_name": "Coconut Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Extra Virgin",
      "grade": "Food Grade",
      "name_alias": "Virgin Coconut Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking",
        "Frying",
        "Baking",
        "Cosmetics"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407710,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Palm Kernel Oil, RBD",
      "description": "Palm Kernel Oil is widely used in food applications such as shortenings, margarines, spreads, cookies, cakes, frostings, pie crusts, and frying. It also finds applications in the cosmetic and pharmaceutical industries.",
      "ingredient_base_name": "Palm Kernel Oil",
      "form": null,
      "concentration": null,
      "processing_method": "RBD (Refined, Bleached, Deodorized)",
      "grade": "Food Grade",
      "name_alias": "Palm Kernel Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Pharmaceutical Ingredients"
      ],
      "applications": [
        "Food & Beverage",
        "Cosmetics",
        "Pharmaceuticals"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407717,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils Rice Bran Oil, RBDW",
      "description": "Rice Bran Oil is a versatile cooking and frying oil with a high smoke point and mild flavor. It also finds applications in the cosmetic and pharmaceutical industries.",
      "ingredient_base_name": "Rice Bran Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined, Bleached, Deodorized, Winterized (RBDW)",
      "grade": "Food Grade",
      "name_alias": "RBDW Rice Bran Oil",
      "product_certifications": [],
      "categories": [
        "Food & Beverage Ingredients",
        "Pharmaceutical Ingredients"
      ],
      "applications": [
        "Cooking Oil",
        "Frying Oil",
        "Cosmetic Formulations",
        "Pharmaceutical Excipients"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407721,
        "supplier_name": "Catania Oils"
      }
    },
    {
      "name": "Catania Oils High Oleic Sunflower Oil, RBD - Organic",
      "description": "High oleic sunflower oil, refined, bleached, and deodorized (RBD), recognized for its health benefits with lower levels of trans fats. Commonly used in high-temperature cooking and as an emollient in cosmetic formulations.",
      "ingredient_base_name": "High Oleic Sunflower Oil",
      "form": "Liquid",
      "concentration": null,
      "processing_method": "Refined, Bleached, Deodorized (RBD)",
      "grade": "Food Grade",
      "name_alias": "High Oleic Sunflower Oil",
      "product_certifications": [
        "Organic"
      ],
      "categories": [
        "Food & Beverage Ingredients",
        "Beauty & Anti-aging"
      ],
      "applications": [
        "Cooking Oils",
        "Cosmetic Formulations"
      ],
      "metadata": {
        "migrated_from_seller_ingredient": true,
        "original_product_id": 407729,
        "supplier_name": "Catania Oils"
      }
    }
  ],
  "key_contacts": [
    {
      "name": "Kelly Bunting",
      "position": "Sales Manager | Bulk Sales at Catania Oils | Providing Food Manufactures High Quality ingredient oils",
      "email": "kbunting@cataniaoils.com",
      "phone": null,
      "linkedin_url": "http://www.linkedin.com/in/kellybunting",
      "department": "Sales"
    },
    {
      "name": "Shawn McKenna",
      "position": "Sales Operations Manager at Catania Oils",
      "email": "smckenna@cataniaoils.com",
      "phone": null,
      "linkedin_url": "http://www.linkedin.com/in/shawn-mckenna9",
      "department": "Operations"
    },
    {
      "name": "Ines Franco",
      "position": "",
      "email": "ifranco@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Gwen Farley",
      "position": "",
      "email": "gfarley@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Stephen Basile",
      "position": "",
      "email": "sbasile@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Matthew Van Valkenburgh",
      "position": "",
      "email": "mvalkenburgh@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Joseph Basile",
      "position": "President",
      "email": "jbasile@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Tj Murphy",
      "position": "",
      "email": "tmurphy@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Joseph T.  Hanson",
      "position": "",
      "email": "jhanson@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Rick Mathien",
      "position": "",
      "email": "rmathien@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    },
    {
      "name": "Michael Coutu",
      "position": "",
      "email": "mcoutu@cataniaoils.com",
      "phone": "",
      "linkedin_url": null,
      "department": null
    }
  ],
  "lead_source": "Web Scraping",
  "source_url": null,
  "is_verified": false,
  "is_active": true,
  "metadata": {
    "original_company_id": 31999
  },
  "created_at": {
    "$date": "2025-05-31T11:12:27.023Z"
  },
  "updated_at": {
    "$date": "2025-06-15T02:53:43.574Z"
  },
  "last_scraped_at": null,
  "persons": [
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572b11c34c8072eea7ca4"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572b81c34c8072eea7cb0"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572bd1c34c8072eea7cbc"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572be1c34c8072eea7cc0"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572c61c34c8072eea7ccf"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572c71c34c8072eea7cd0"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572c71c34c8072eea7cd1"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572c81c34c8072eea7cd5"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "684572cb1c34c8072eea7cdb"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6847b65fbe29e319ad188873"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6847e9cc508783e89fc669ab"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6847fcbc94a602b2b9dab08c"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "68480aa8daf460fd28172e2e"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848584f1b86a8f5a5e57d81"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848713443f12f695220f1f5"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848776850bac3de4fdac8ac"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848b64c05e68852c4fbdd02"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848b7a07bcf5d12af6e8598"
      }
    },
    {
      "$ref": "PersonLead",
      "$id": {
        "$oid": "6848e56c65386d326b063214"
      }
    }
  ],
  "products_detailed": []
}

ingredient 

{
  "_id": {
    "$oid": "66a21433fee5da0a2585a25d"
  },
  "product_id": 1008954,
  "name": "L-Carnitine",
  "description": "L-Carnitine is a naturally occurring amino acid derivative that plays a crucial role in energy production by transporting fatty acids into the mitochondria, where they are burned for energy. Widely recognized for its benefits in enhancing athletic performance and supporting weight loss, L-Carnitine is a popular supplement among fitness enthusiasts and athletes. It is also known to improve heart health, cognitive function, and muscle recovery.\n\nIn the market, L-Carnitine is available in various forms, including liquid, capsule, and powder, catering to diverse consumer preferences. The demand for L-Carnitine has been on the rise, driven by the growing interest in health and wellness, particularly in the sports nutrition sector. Additionally, its inclusion in energy drinks and functional foods has broadened its appeal.\n\nRecent trends indicate a shift towards more natural and plant-based sources of L-Carnitine, aligning with the increasing consumer inclination towards clean-label products. As research continues to uncover more health benefits, L-Carnitine is poised to maintain its strong presence in the nutraceutical market, offering a versatile and effective solution for those seeking to enhance their overall well-being.",
  "slug": "l-carnitine",
  "banner_url": "https://tovvistorage.blob.core.windows.net/product-image/mitocarn/6301e9a8-4b46-481d-a43f-392335a07428.jpg",
  "logo_url": "https://tovvistorage.blob.core.windows.net/ingredient-photo/l-carnitine/generated_ingredient_68404361-6521-46e1-ab63-c663ae8d9bf1.png",
  "product_image_urls": [],
  "number_of_suppliers": 9,
  "categories": [
    "Sports Nutrition",
    "Weight Management",
    "Heart Health"
  ],
  "tags": [
    "energy production",
    "fat metabolism",
    "muscle recovery",
    "cognitive support"
  ],
  "status": "ACTIVE",
  "documents": [],
  "created_at": {
    "$date": "2024-04-13T18:04:14.038Z"
  },
  "updated_at": {
    "$date": "2025-06-15T08:39:45.774Z"
  },
  "created_by": null,
  "last_indexed_at": {
    "$date": "2024-08-01T08:48:38.679Z"
  },
  "override_type": "ingredient"
}