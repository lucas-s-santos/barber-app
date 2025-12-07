import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'selected_barbershop_v1';

const BarbershopContext = createContext({
  selectedBarbershop: null,
  loadingBarbershop: true,
  selectBarbershop: () => {},
  clearBarbershop: () => {},
});

export function BarbershopProvider({ children }) {
  const [selectedBarbershop, setSelectedBarbershop] = useState(null);
  const [loadingBarbershop, setLoadingBarbershop] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // LIMPEZA TEMPORÁRIA: Sempre começar sem barbearia selecionada
        console.log('🔄 BarbershopContext: Iniciando sem barbearia selecionada');
        await AsyncStorage.removeItem(STORAGE_KEY);
        setSelectedBarbershop(null);
      } catch (err) {
        console.warn('Erro ao limpar barbearia selecionada', err);
      } finally {
        setLoadingBarbershop(false);
      }
    };
    load();
  }, []);

  const selectBarbershop = useCallback(async (barbershop) => {
    setSelectedBarbershop(barbershop);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(barbershop));
    } catch (err) {
      console.warn('Erro ao salvar barbearia selecionada', err);
    }
  }, []);

  const clearBarbershop = useCallback(async () => {
    setSelectedBarbershop(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Erro ao limpar barbearia selecionada', err);
    }
  }, []);

  return (
    <BarbershopContext.Provider
      value={{ selectedBarbershop, loadingBarbershop, selectBarbershop, clearBarbershop }}
    >
      {children}
    </BarbershopContext.Provider>
  );
}

export const useBarbershop = () => useContext(BarbershopContext);
