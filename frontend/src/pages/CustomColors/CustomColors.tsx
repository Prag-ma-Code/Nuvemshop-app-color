import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { navigateHeaderRemove } from '@tiendanube/nexo';
import {
  Badge,
  Box,
  Button,
  Card,
  Input,
  Spinner,
  Tag,
  Text,
  Thumbnail,
  useToast,
} from '@nimbus-ds/components';
import { Layout, Page } from '@nimbus-ds/patterns';

import { nexo } from '@/app';
import { useFetch } from '@/hooks';
import { IProduct, IVariant } from '../Products/products.types';

interface ColorMapping {
  color_hex: string;
  display_name?: string;
}

interface ColorMappings {
  [variantName: string]: ColorMapping;
}

const nativeColorTerms = [
  'color', 'colour', 'cor', 'couleur', 'colore', 'farbe', 'swatch',
];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getProductName = (product: IProduct): string =>
  product.name.pt || product.name.es || product.name.en || `#${product.id}`;

const getVariantName = (variant: IVariant, product: IProduct): string => {
  const variantValues = variant.values
    .map((value) => Object.values(value)[0])
    .filter(Boolean)
    .map(String);

  if (variantValues.length > 0) {
    return variantValues.join(' / ');
  }

  return `${getProductName(product)} - ${variant.id}`;
};

const isNativeColorVariant = (variant: IVariant, product: IProduct): boolean => {
  const attributeText = (product.attributes ?? [])
    .flatMap((attribute) => Object.values(attribute))
    .map((value) => normalizeText(String(value)));

  const variantText = variant.values
    .flatMap((value) => Object.values(value))
    .map((value) => normalizeText(String(value ?? '')));

  return [...attributeText, ...variantText].some((value) =>
    nativeColorTerms.some((term) => value.includes(term)),
  );
};

const CustomColors: React.FC = () => {
  const { t } = useTranslation('translations');
  const { addToast } = useToast();
  const { request } = useFetch();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [savedMappings, setSavedMappings] = useState<ColorMappings>({});
  const [draftMappings, setDraftMappings] = useState<ColorMappings>({});
  const [showNativeColors, setShowNativeColors] = useState(true);
  const [isLoading, setIsLoading] = useState({
    products: false,
    mappings: false,
    saving: false,
  });

  useEffect(() => {
    navigateHeaderRemove(nexo);
    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setSavedMappings({});
      setDraftMappings({});
      return;
    }
    loadSavedMappings(selectedProductId);
  }, [selectedProductId]);

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );

  const visibleVariants = (selectedProduct?.variants ?? [])
    .filter((variant) =>
      selectedProduct
        ? showNativeColors || !isNativeColorVariant(variant, selectedProduct)
        : false,
    )
    .filter((variant) => {
      const term = normalizeText(variantSearch);
      if (!term) return true;
      return normalizeText(getVariantName(variant, selectedProduct!)).includes(term);
    });

  const filteredProducts = products.filter((product) => {
    const term = normalizeText(searchTerm);
    if (!term) return true;
    return normalizeText(getProductName(product)).includes(term);
  });

  const loadProducts = () => {
    setIsLoading((current) => ({ ...current, products: true }));

    request<IProduct[]>({ url: '/products', method: 'GET' })
      .then((response) => {
        const nextProducts = response.content ?? [];
        setProducts(nextProducts);
        setSelectedProductId((currentSelected) =>
          currentSelected ?? nextProducts[0]?.id ?? null,
        );
      })
      .catch(() => setProducts([]))
      .finally(() => {
        setIsLoading((current) => ({ ...current, products: false }));
      });
  };

  const loadSavedMappings = (productId: number) => {
    setIsLoading((current) => ({ ...current, mappings: true }));

    request<ColorMappings>({ url: `/custom-colors/${productId}`, method: 'GET' })
      .then((response) => {
        setSavedMappings(response.content ?? {});
        setDraftMappings({});
      })
      .catch(() => {
        setSavedMappings({});
        setDraftMappings({});
      })
      .finally(() => {
        setIsLoading((current) => ({ ...current, mappings: false }));
      });
  };

  const getMapping = (variantName: string): ColorMapping => {
    return draftMappings[variantName] ?? savedMappings[variantName] ?? { color_hex: '#d1d5db', display_name: '' };
  };

  const isDraft = (variantName: string): boolean => {
    return variantName in draftMappings;
  };

  const handleColorChange = (variantName: string, colorHex: string) => {
    setDraftMappings((current) => ({
      ...current,
      [variantName]: { ...getMapping(variantName), color_hex: colorHex },
    }));
  };

  const handleDisplayNameChange = (variantName: string, displayName: string) => {
    setDraftMappings((current) => ({
      ...current,
      [variantName]: { ...getMapping(variantName), display_name: displayName },
    }));
  };

  const handleSave = () => {
    if (!selectedProduct) return;

    setIsLoading((current) => ({ ...current, saving: true }));

    const mergedMappings: ColorMappings = { ...savedMappings };
    Object.entries(draftMappings).forEach(([key, value]) => {
      mergedMappings[key] = value;
    });

    const payload = {
      product_id: selectedProduct.id,
      mappings: mergedMappings,
    };

    request<ColorMappings>({ url: '/custom-colors', method: 'PUT', data: payload })
      .then((response) => {
        setSavedMappings(response.content ?? mergedMappings);
        setDraftMappings({});
        addToast({
          type: 'success',
          text: t('custom-colors.editor.save-success'),
          duration: 4000,
          id: 'save-success',
        });
      })
      .catch(() => {
        addToast({
          type: 'danger',
          text: t('custom-colors.editor.save-error'),
          duration: 4000,
          id: 'save-error',
        });
      })
      .finally(() => {
        setIsLoading((current) => ({ ...current, saving: false }));
      });
  };

  return (
    <Page
      maxWidth="1200px"
      minHeight={{
        xs: 'calc(100vh - 65px)',
        md: 'calc(100vh - 66px)',
        lg: 'calc(100vh - 66px)',
      }}
    >
      <Page.Header title={t('custom-colors.title')} />
      <Page.Body px={{ xs: 'none', md: '6' }}>
        <Layout columns="1">
          <Layout.Section>
            <Box display="flex" flexDirection="column" gap="4">
              <Text>{t('custom-colors.description')}</Text>

              <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap="4">
                <Card>
                  <Card.Header title={t('custom-colors.products.title')} />
                  <Card.Body>
                    <Box display="flex" flexDirection="column" gap="3">
                      <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={t('custom-colors.products.search')}
                      />

                      <Box
                        display="flex"
                        flexDirection="column"
                        gap="2"
                        maxHeight="520px"
                        overflow="auto"
                      >
                        {isLoading.products && (
                          <Box display="flex" justifyContent="center" padding="4">
                            <Spinner size="small" />
                          </Box>
                        )}

                        {!isLoading.products &&
                          filteredProducts.map((product) => {
                            const isActive = product.id === selectedProductId;

                            return (
                              <Card
                                key={product.id}
                                onClick={() => setSelectedProductId(product.id)}
                                style={{
                                  cursor: 'pointer',
                                  outline: isActive ? '2px solid' : undefined,
                                  outlineColor: isActive ? 'var(--nimbus-color-primary-interactive)' : undefined,
                                }}
                              >
                                <Card.Body>
                                  <Box display="flex" gap="3" alignItems="center">
                                    <Thumbnail
                                      src={product.images?.[0]?.src}
                                      width="44px"
                                      alt={getProductName(product)}
                                    />
                                    <Box display="flex" flexDirection="column" gap="1" flex="1">
                                      <Text fontWeight="bold">{getProductName(product)}</Text>
                                      <Text fontSize="caption" color="neutral-textLow">
                                        {product.variants?.length ?? 0} {t('custom-colors.products.variants')}
                                      </Text>
                                    </Box>
                                  </Box>
                              </Card.Body>
                              </Card>
                            );
                          })}

                        {!isLoading.products && filteredProducts.length === 0 && (
                          <Text>{t('custom-colors.products.empty')}</Text>
                        )}
                      </Box>
                    </Box>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header
                    title={
                      selectedProduct
                        ? getProductName(selectedProduct)
                        : t('custom-colors.editor.empty-title')
                    }
                  />
                  <Card.Body>
                    {!selectedProduct && <Text>{t('custom-colors.editor.empty')}</Text>}

                    {selectedProduct && (
                      <Box display="flex" flexDirection="column" gap="4">
                        <Box display="flex" flexDirection="row" gap="2" alignItems="center" flexWrap="wrap">
                          <Box display="flex" flexDirection="column" gap="1" flex="1">
                            <Text>{t('custom-colors.editor.helper')}</Text>
                          </Box>
                          <Button
                            appearance="neutral"
                            onClick={() => setShowNativeColors((current) => !current)}
                          >
                            {showNativeColors
                              ? t('custom-colors.editor.hide-native')
                              : t('custom-colors.editor.show-native')}
                          </Button>
                        </Box>

                        <Input
                          value={variantSearch}
                          onChange={(event) => setVariantSearch(event.target.value)}
                          placeholder={t('custom-colors.editor.search-variant')}
                        />

                        {isLoading.mappings && (
                          <Box display="flex" justifyContent="center" padding="4">
                            <Spinner size="small" />
                          </Box>
                        )}

                        {!isLoading.mappings && visibleVariants.length === 0 && (
                          <Text>{t('custom-colors.editor.no-variants')}</Text>
                        )}

                        {!isLoading.mappings &&
                          visibleVariants.map((variant) => {
                            const variantName = getVariantName(variant, selectedProduct);
                            const mapping = getMapping(variantName);
                            const hasDraft = isDraft(variantName);

                            return (
                              <Card key={variant.id}>
                                <Card.Body>
                                  <Box display="flex" flexDirection="column" gap="3">
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Box display="flex" gap="2" alignItems="center">
                                        <Text fontWeight="bold">{variantName}</Text>
                                        {isNativeColorVariant(variant, selectedProduct) && (
                                          <Tag appearance="neutral">
                                            {t('custom-colors.editor.native-color')}
                                          </Tag>
                                        )}
                                        {hasDraft && (
                                          <Badge appearance="warning" count={t('custom-colors.editor.unsaved')} />
                                        )}
                                      </Box>
                                    </Box>

                                    <Box display="flex" flexDirection="row" gap="3" alignItems="center" flexWrap="wrap">
                                      <Box display="flex" gap="2" alignItems="center" flex="1">
                                        <Box
                                          style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: mapping.color_hex,
                                            border: '2px solid #e5e7eb',
                                            flexShrink: 0,
                                          }}
                                        />
                                        <input
                                          type="color"
                                          value={mapping.color_hex}
                                          onChange={(event) =>
                                            handleColorChange(variantName, event.target.value)
                                          }
                                          style={{
                                            width: '40px',
                                            height: '36px',
                                            border: 'none',
                                            background: 'transparent',
                                            padding: 0,
                                            cursor: 'pointer',
                                          }}
                                        />
                                        <Text fontSize="caption" color="neutral-textLow">
                                          {mapping.color_hex.toUpperCase()}
                                        </Text>
                                      </Box>

                                      <Box display="flex" flexDirection="column" gap="1" flex="2">
                                        <Text fontSize="caption">{t('custom-colors.editor.display-name')}</Text>
                                        <Input
                                          value={mapping.display_name ?? ''}
                                          onChange={(event) =>
                                            handleDisplayNameChange(variantName, event.target.value)
                                          }
                                          placeholder={variantName}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>
                                </Card.Body>
                              </Card>
                            );
                          })}

                        <Box display="flex" justifyContent="flex-end">
                          <Button appearance="primary" onClick={handleSave} disabled={isLoading.saving}>
                            {isLoading.saving && <Spinner color="currentColor" size="small" />}
                            {t('custom-colors.editor.save')}
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Card.Body>
                </Card>
              </Box>
            </Box>
          </Layout.Section>
        </Layout>
      </Page.Body>
    </Page>
  );
};

export default CustomColors;
