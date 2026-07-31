import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@nimbus-ds/components';
import { ChevronDownIcon, ChevronUpIcon } from '@nimbus-ds/icons';
import { COLOR_PRESETS } from './colorPresets';

const normalizeHex = (value: string): string => String(value || '').toLowerCase();

interface ColorPresetSelectProps {
  value: string;
  onChange: (colorHex: string) => void;
}

const ColorPresetSelect: React.FC<ColorPresetSelectProps> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedPreset = useMemo(() => {
    const normalized = normalizeHex(value);
    return (
      COLOR_PRESETS.find(
        (preset) => normalizeHex(preset.hex) === normalized,
      ) ?? null
    );
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (colorHex: string) => {
    onChange(colorHex);
    setIsOpen(false);
  };

  return (
    <Box position="relative" ref={containerRef}>
      <Box
        onClick={() => setIsOpen((current) => !current)}
        display="flex"
        alignItems="center"
        gap="2"
        padding="3"
        backgroundColor="neutral-surface"
        borderWidth="1"
        borderStyle="solid"
        borderColor="neutral-interactive"
        borderRadius="2"
        cursor="pointer"
        width="100%"
      >
        <Box
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            backgroundColor: value || 'transparent',
            border: '1px solid #e5e7eb',
            flexShrink: 0,
          }}
        />
        <Text
          fontSize="caption"
          color="neutral-textHigh"
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {selectedPreset ? selectedPreset.name : (value || '').toUpperCase()}
        </Text>
        {isOpen ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
      </Box>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left="0"
          right="0"
          marginTop="1"
          zIndex="100"
          backgroundColor="neutral-background"
          borderWidth="1"
          borderStyle="solid"
          borderColor="neutral-interactive"
          borderRadius="2"
          boxShadow="2"
          overflow="auto"
          maxHeight="260px"
        >
          {COLOR_PRESETS.map((preset) => {
            const isSelected = normalizeHex(preset.hex) === normalizeHex(value);

            return (
              <Box
                key={preset.hex}
                onClick={() => handleSelect(preset.hex)}
                display="flex"
                alignItems="center"
                gap="2"
                padding="3"
                cursor="pointer"
                backgroundColor={{
                  xs: isSelected ? 'primary-surfaceHighlight' : 'transparent',
                  hover: 'neutral-surfaceHighlight',
                }}
              >
                <Box
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    backgroundColor: preset.hex,
                    border: '1px solid #e5e7eb',
                    flexShrink: 0,
                  }}
                />
                <Text fontSize="caption" color="neutral-textHigh">
                  {preset.name}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ColorPresetSelect;
