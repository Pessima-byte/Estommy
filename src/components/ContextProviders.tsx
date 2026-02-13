"use client";
import { ProductsProvider } from "../contexts/ProductsContext";
import { CustomersProvider } from "../contexts/CustomersContext";
import { SalesProvider } from "../contexts/SalesContext";
import { CreditsProvider } from "../contexts/CreditsContext";
import { ProfitsProvider } from "../contexts/ProfitsContext";
import { ActivityProvider } from "../contexts/ActivityContext";
import { CategoriesProvider } from "../contexts/CategoriesContext";
import { DebtorsProvider } from "../contexts/DebtorsContext";
import { UsersProvider } from "../contexts/UsersContext";

export function ContextProviders({ children }: { children: React.ReactNode }) {
    return (
        <ProductsProvider>
            <CustomersProvider>
                <SalesProvider>
                    <CreditsProvider>
                        <ProfitsProvider>
                            <ActivityProvider>
                                <DebtorsProvider>
                                    <CategoriesProvider>
                                        <UsersProvider>
                                            {children}
                                        </UsersProvider>
                                    </CategoriesProvider>
                                </DebtorsProvider>
                            </ActivityProvider>
                        </ProfitsProvider>
                    </CreditsProvider>
                </SalesProvider>
            </CustomersProvider>
        </ProductsProvider>
    );
}
