import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AdministrationRhLayout } from './modules/administration-rh/AdministrationRhLayout'
import { AdministrationRhHomePage } from './modules/administration-rh/pages/AdministrationRhHomePage'
import { AdministrationRhSectionPage } from './modules/administration-rh/pages/AdministrationRhSectionPage'
import { ListePersonnelVerificationPage } from './modules/administration-rh/pages/ListePersonnelVerificationPage'
import { PopulationEntreprisePage } from './modules/administration-rh/pages/PopulationEntreprisePage'
import { Bareme1VerificationPage } from './modules/administration-rh/pages/Bareme1VerificationPage'
import { Bareme2VerificationPage } from './modules/administration-rh/pages/Bareme2VerificationPage'
import { FeuillePaieMensuellePage } from './modules/administration-rh/pages/FeuillePaieMensuellePage'
import { PresencesLayout } from './modules/presences/PresencesLayout'
import { PresencesHubPage } from './modules/presences/pages/PresencesHubPage'
import { PresencesFeaturePage } from './modules/presences/pages/PresencesFeaturePage'
import { PaieLayout } from './modules/paie/PaieLayout'
import { PaieHubPage } from './modules/paie/pages/PaieHubPage'
import { PaieFeaturePage } from './modules/paie/pages/PaieFeaturePage'
import { PreparationPaieLayout } from './modules/paie/pages/PreparationPaieLayout'
import { PreparationPaieHomePage } from './modules/paie/pages/PreparationPaieHomePage'
import { PaieMensuelleB1Page } from './modules/paie/pages/PaieMensuelleB1Page'
import { PaieMensuelleB2Page } from './modules/paie/pages/PaieMensuelleB2Page'
import { PeculeCongePage } from './modules/paie/pages/PeculeCongePage'
import { BulletinsPaieLayout } from './modules/paie/pages/BulletinsPaieLayout'
import { BulletinsPaieHomePage } from './modules/paie/pages/BulletinsPaieHomePage'
import { BulletinAncienBaremePage } from './modules/paie/pages/BulletinAncienBaremePage'
import { BulletinNouveauBaremePage } from './modules/paie/pages/BulletinNouveauBaremePage'
import { BulletinPrimeTypePage } from './modules/paie/pages/BulletinPrimeTypePage'
import { RecrutementLayout } from './modules/recrutement/RecrutementLayout'
import { CapturesInfoPage } from './modules/recrutement/pages/CapturesInfoPage'
import { SuiviPersonnelPage } from './modules/recrutement/pages/SuiviPersonnelPage'
import { FormationPersonnelPage } from './modules/recrutement/pages/FormationPersonnelPage'
import { ComplementDossierPersonnelPage } from './modules/recrutement/pages/ComplementDossierPersonnelPage'
import { AdministrateursPage } from './modules/recrutement/pages/AdministrateursPage'
import { PersonnelPage } from './modules/recrutement/pages/PersonnelPage'
import { StagiairesPage } from './modules/recrutement/pages/StagiairesPage'
import { PromotionsPage } from './modules/recrutement/pages/PromotionsPage'
import { SanctionsPage } from './modules/recrutement/pages/SanctionsPage'
import { FormationsPage } from './modules/recrutement/pages/FormationsPage'
import { EvaluationsPage } from './modules/recrutement/pages/EvaluationsPage'
import { ParametresLayout } from './modules/parametres/ParametresLayout'
import { UtilisateursPage } from './modules/parametres/pages/UtilisateursPage'
import { EntreprisesPage } from './modules/parametres/pages/EntreprisesPage'
import {
  Bareme1FichierPage,
  Bareme2FichierPage,
  MonnaieFichierPage,
  PeriodeFichierPage,
  PlaceholderToolPage,
  RefFichierPage,
  TauxMonnaieFichierPage,
} from './modules/parametres/pages/FichiersPages'
import { CongeFichierPage } from './modules/parametres/pages/CongeFichierPage'
import { ImportPersonnelPage } from './modules/parametres/pages/ImportPersonnelPage'
import { ImportBareme1Page } from './modules/parametres/pages/ImportBareme1Page'
import { ImportBareme2Page } from './modules/parametres/pages/ImportBareme2Page'
import { ImportFichierStructurePage } from './modules/parametres/pages/ImportFichierStructurePage'
import { ParametresHomePage } from './modules/parametres/pages/ParametresHomePage'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/administration-rh" element={<AdministrationRhLayout />}>
          <Route index element={<AdministrationRhHomePage />} />
          <Route
            path="fichier"
            element={
              <p className="inline-hint">
                Choisissez un sous-menu dans « Fichier ».
              </p>
            }
          />
          <Route
            path="fichier/organigramme"
            element={
              <AdministrationRhSectionPage
                title="Organigramme"
                description="Consultez et structurez l’organigramme de l’organisation."
                upcoming={[
                  'Arborescence des directions et services',
                  'Affectation des postes',
                  'Export de l’organigramme',
                ]}
              />
            }
          />
          <Route
            path="fichier/description-postes"
            element={
              <AdministrationRhSectionPage
                title="Description des postes"
                description="Gérez les fiches et descriptions des postes de travail."
                upcoming={[
                  'Fiches de poste',
                  'Compétences et responsabilités',
                  'Mise à jour des profils',
                ]}
              />
            }
          />
          <Route
            path="fichier/documents-reglementaires"
            element={
              <AdministrationRhSectionPage
                title="Documents réglementaires"
                description="Centralisez les documents juridiques et réglementaires RH."
                upcoming={[
                  'Règlement intérieur',
                  'Procédures RH',
                  'Textes réglementaires',
                ]}
              />
            }
          />
          <Route
            path="verification-validation"
            element={
              <p className="inline-hint">
                Choisissez un sous-menu dans « Vérification et Validation ».
              </p>
            }
          />
          <Route
            path="verification-validation/situation-administrateurs"
            element={
              <AdministrationRhSectionPage
                title="Situation des administrateurs"
                description="Vérifiez et validez la situation des administrateurs."
                upcoming={[
                  'Contrôle des mandats en cours',
                  'Vérification des dossiers administrateurs',
                  'Validation de la situation',
                ]}
              />
            }
          />
          <Route
            path="verification-validation/liste-personnel"
            element={<ListePersonnelVerificationPage />}
          />
          <Route
            path="verification-validation/bareme-applique"
            element={<Navigate to="1er-bareme" replace />}
          />
          <Route
            path="verification-validation/bareme-applique/1er-bareme"
            element={<Bareme1VerificationPage />}
          />
          <Route
            path="verification-validation/bareme-applique/2eme-bareme"
            element={<Bareme2VerificationPage />}
          />
          <Route
            path="verification-validation/feuille-paie-mensuelle"
            element={<FeuillePaieMensuellePage />}
          />
          <Route
            path="verification-validation/feuille-paie-administrateur"
            element={
              <AdministrationRhSectionPage
                title="Feuille de Paie des administrateurs"
                description="Vérifiez et validez la feuille de paie des administrateurs."
                upcoming={[
                  'Consultation de la feuille de paie administrateur',
                  'Contrôle des montants et retenues',
                  'Validation de la feuille de paie',
                ]}
              />
            }
          />
          <Route
            path="validation-personnel"
            element={
              <Navigate to="../verification-validation" replace />
            }
          />
          <Route
            path="statistiques"
            element={
              <p className="inline-hint">
                Choisissez un sous-menu dans « Statistiques ».
              </p>
            }
          />
          <Route
            path="statistiques/population-entreprise"
            element={<PopulationEntreprisePage />}
          />
          <Route
            path="statistiques/direction-gen-par-grade"
            element={
              <AdministrationRhSectionPage
                title="Du personnel de la Dir. Gen. par grade"
                description="Analysez les effectifs de la Direction Générale par grade."
                upcoming={[
                  'Répartition par grade',
                  'Tableaux de synthèse',
                  'Export des statistiques',
                ]}
              />
            }
          />
          <Route
            path="statistiques/dir-provinciales-par-grade"
            element={
              <AdministrationRhSectionPage
                title="Du personnel des Dir. Provinciales par grade"
                description="Analysez les effectifs des Directions Provinciales par grade."
                upcoming={[
                  'Répartition provinciale',
                  'Comparatif par grade',
                  'Export des statistiques',
                ]}
              />
            }
          />
        </Route>
        <Route path="/recrutement" element={<RecrutementLayout />}>
          <Route index element={<Navigate to="captures" replace />} />
          <Route path="captures" element={<CapturesInfoPage />} />
          <Route path="captures/administrateurs" element={<AdministrateursPage />} />
          <Route path="captures/mandataires" element={<Navigate to="../administrateurs" replace />} />
          <Route path="captures/personnel" element={<PersonnelPage />} />
          <Route path="captures/stagiaires" element={<StagiairesPage />} />
          <Route path="suivi" element={<SuiviPersonnelPage />} />
          <Route path="suivi/promotions" element={<PromotionsPage />} />
          <Route path="suivi/sanctions" element={<SanctionsPage />} />
          <Route path="suivi/formations" element={<FormationsPage />} />
          <Route path="suivi/evaluations" element={<EvaluationsPage />} />
          <Route path="formation" element={<FormationPersonnelPage />} />
          <Route path="formation/besoins" element={<FormationsPage />} />
          <Route
            path="formation/formations"
            element={<Navigate to="../besoins" replace />}
          />
          <Route
            path="complement-dossier"
            element={<ComplementDossierPersonnelPage />}
          />
        </Route>
        <Route path="/presences" element={<PresencesLayout />}>
          <Route index element={<PresencesHubPage />} />
          <Route
            path="pointage"
            element={
              <PresencesFeaturePage
                title="Pointage quotidien"
                description="Enregistrez les heures d’entrée et de sortie du personnel."
                upcoming={[
                  'Saisie entrée / sortie par agent',
                  'Import des pointages',
                  'Contrôle des écarts horaires',
                ]}
              />
            }
          />
          <Route
            path="calendrier-conges"
            element={
              <PresencesFeaturePage
                title="Calendrier de congés"
                description="Visualisez et gérez le calendrier des congés du personnel."
                upcoming={[
                  'Vue mensuelle des congés',
                  'Demandes et validations',
                  'Soldes de congés',
                ]}
              />
            }
          />
          <Route
            path="absences-retards"
            element={
              <PresencesFeaturePage
                title="Suivi des absences et retards"
                description="Suivez les absences, retards et justifications associées."
                upcoming={[
                  'Enregistrement des absences',
                  'Suivi des retards',
                  'Justificatifs et motifs',
                ]}
              />
            }
          />
          <Route
            path="rapports"
            element={
              <PresencesFeaturePage
                title="Rapports de présence"
                description="Consultez les rapports de présence par période et par agent."
                upcoming={[
                  'Rapports journaliers et mensuels',
                  'Filtres par service / site',
                  'Export Excel / PDF',
                ]}
              />
            }
          />
        </Route>
        <Route path="/paie" element={<PaieLayout />}>
          <Route index element={<PaieHubPage />} />
          <Route path="preparation" element={<PreparationPaieLayout />}>
            <Route index element={<PreparationPaieHomePage />} />
            <Route
              path="fichier"
              element={
                <p className="inline-hint">
                  Choisissez un sous-menu dans « Fichier ».
                </p>
              }
            />
            <Route
              path="fichier/dette-personnel"
              element={
                <PaieFeaturePage
                  title="Dette du personnel"
                  description="Suivez et gérez les dettes du personnel dans la préparation de la paie."
                  upcoming={[
                    'Enregistrement des dettes',
                    'Échéanciers de remboursement',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="fichier/assistance-sociale"
              element={
                <PaieFeaturePage
                  title="Assistance sociale"
                  description="Gérez les aides et l’assistance sociale liées à la paie."
                  upcoming={[
                    'Saisie des aides sociales',
                    'Suivi des bénéficiaires',
                    'Intégration aux retenues / avantages',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="paie-personnel"
              element={
                <Navigate
                  to="/paie/preparation/paie-personnel/bareme-1"
                  replace
                />
              }
            />
            <Route
              path="paie-personnel/bareme-1"
              element={<PaieMensuelleB1Page />}
            />
            <Route
              path="paie-personnel/bareme-2"
              element={<PaieMensuelleB2Page />}
            />
            <Route
              path="paie-personnel/paie-mensuelle-avantage"
              element={
                <PaieFeaturePage
                  title="Paie Mensuelle et avantage"
                  description="Consultez et gérez la paie mensuelle combinée aux avantages du personnel."
                  upcoming={[
                    'Calcul de la paie mensuelle avec avantages',
                    'Intégration des primes et avantages',
                    'Consultation et validation des montants',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages"
              element={
                <Navigate
                  to="/paie/preparation/primes-avantages/prime-vie-chere"
                  replace
                />
              }
            />
            <Route
              path="primes-avantages/prime-vie-chere"
              element={
                <PaieFeaturePage
                  title="Prime de vie chère"
                  description="Saisissez et gérez la prime de vie chère du personnel."
                  upcoming={[
                    'Saisie des montants',
                    'Critères d’éligibilité',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-performance"
              element={
                <PaieFeaturePage
                  title="Prime de performance"
                  description="Saisissez et gérez la prime de performance du personnel."
                  upcoming={[
                    'Saisie des montants',
                    'Critères de performance',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-astreinte"
              element={
                <PaieFeaturePage
                  title="Prime d'astreinte"
                  description="Saisissez et gérez la prime d’astreinte du personnel."
                  upcoming={[
                    'Saisie des montants',
                    'Périodes d’astreinte',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/indemnite-kilometrique"
              element={
                <PaieFeaturePage
                  title="Indemnité Kilométrique"
                  description="Saisissez et gérez l’indemnité kilométrique du personnel."
                  upcoming={[
                    'Saisie des kilomètres',
                    'Calcul des indemnités',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-travaux-intensifs"
              element={
                <PaieFeaturePage
                  title="Prime des travaux intensifs"
                  description="Saisissez et gérez la prime des travaux intensifs."
                  upcoming={[
                    'Saisie des montants',
                    'Périodes de travaux intensifs',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-interim"
              element={
                <PaieFeaturePage
                  title="Prime d'interim"
                  description="Saisissez et gérez la prime d’intérim du personnel."
                  upcoming={[
                    'Saisie des montants',
                    'Périodes d’intérim',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-risque"
              element={
                <PaieFeaturePage
                  title="Prime de risque"
                  description="Saisissez et gérez la prime de risque du personnel."
                  upcoming={[
                    'Saisie des montants',
                    'Niveaux de risque',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/prime-comite-directions"
              element={
                <PaieFeaturePage
                  title="Prime de Comité des directions"
                  description="Saisissez et gérez la prime de Comité des directions."
                  upcoming={[
                    'Saisie des montants',
                    'Bénéficiaires du comité',
                    'Intégration à la feuille de paie',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="pecule-conge"
              element={<PeculeCongePage />}
            />
          </Route>
          <Route
            path="feuille-paie"
            element={
              <PaieFeaturePage
                title="Feuille de Paie"
                description="Consultez et contrôlez la feuille de paie consolidée."
                upcoming={[
                  'Vue consolidée par agent',
                  'Totaux brut / net / retenues',
                  'Export de la feuille de paie',
                ]}
              />
            }
          />
          <Route path="bulletins" element={<BulletinsPaieLayout />}>
            <Route index element={<BulletinsPaieHomePage />} />
            <Route
              path="fichier"
              element={
                <PaieFeaturePage
                  title="Fichier"
                  description="Gérez les fichiers liés aux bulletins de paie."
                  upcoming={[
                    'Consultation des fichiers',
                    'Import / export',
                    'Archivage des bulletins',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="mensuels"
              element={
                <Navigate
                  to="/paie/bulletins/mensuels/ancien-bareme"
                  replace
                />
              }
            />
            <Route
              path="mensuels/ancien-bareme"
              element={<BulletinAncienBaremePage />}
            />
            <Route
              path="mensuels/nouveau-bareme"
              element={<BulletinNouveauBaremePage />}
            />
            <Route
              path="mensuels/avec-primes"
              element={
                <PaieFeaturePage
                  title="Bulletin avec primes"
                  description="Générez et consultez les bulletins de paie intégrant les primes."
                  upcoming={[
                    'Génération des bulletins avec primes',
                    'Consultation par période',
                    'Impression des bulletins',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages"
              element={
                <PaieFeaturePage
                  title="Bulletins Primes et avantages"
                  description="Choisissez une prime via le menu « Bulletins Primes et avantages »."
                  upcoming={[
                    'Bulletins de primes',
                    'Avantages du personnel',
                    'Impression et export',
                  ]}
                  showBackLink={false}
                />
              }
            />
            <Route
              path="primes-avantages/:codePrime"
              element={<BulletinPrimeTypePage />}
            />
            <Route
              path="statistiques"
              element={
                <PaieFeaturePage
                  title="Statistiques"
                  description="Consultez les statistiques liées aux bulletins de paie."
                  upcoming={[
                    'Effectifs et montants',
                    'Répartitions par période',
                    'Export des statistiques',
                  ]}
                  showBackLink={false}
                />
              }
            />
          </Route>
          <Route
            path="bulletin-individuel"
            element={
              <PaieFeaturePage
                title="Bulletin Individuel"
                description="Affichez et imprimez le bulletin de paie d’un agent."
                upcoming={[
                  'Recherche par matricule / nom',
                  'Détail des gains et retenues',
                  'Impression du bulletin',
                ]}
              />
            }
          />
        </Route>
        <Route path="/parametres" element={<ParametresLayout />}>
          <Route index element={<ParametresHomePage />} />
          <Route path="utilisateurs" element={<Navigate to="fichiers/utilisateurs" replace />} />
          <Route path="entreprises" element={<Navigate to="fichiers/entreprises" replace />} />
          <Route path="fichiers/entreprises" element={<EntreprisesPage />} />
          <Route path="fichiers/utilisateurs" element={<UtilisateursPage />} />
          <Route
            path="fichiers/categories-utilisateurs"
            element={
              <RefFichierPage
                title="Catégorie utilisateurs"
                description="Catégories et profils d’utilisateurs de la plateforme."
                collection="categoriesUtilisateurs"
                addLabel="Nouvelle catégorie"
              />
            }
          />
          <Route
            path="fichiers/grades"
            element={
              <RefFichierPage
                title="Grade"
                description="Grades du personnel."
                collection="grades"
                addLabel="Nouveau grade"
              />
            }
          />
          <Route
            path="fichiers/fonctions"
            element={
              <RefFichierPage
                title="Fonction AG"
                description="Fonctions et postes du personnel (fichier père FONCTION_AG)."
                collection="fonctions"
                addLabel="Nouvelle fonction"
              />
            }
          />
          <Route path="fichiers/bareme1" element={<Bareme1FichierPage />} />
          <Route path="fichiers/bareme2" element={<Bareme2FichierPage />} />
          <Route
            path="fichiers/primes"
            element={
              <RefFichierPage
                title="Prime"
                description="Codes et libellés des types de primes et indemnités."
                collection="primes"
                addLabel="Nouvelle prime"
                codeHeader="CODE PRIME"
                libelleHeader="LIBELLE"
              />
            }
          />
          <Route path="fichiers/conge" element={<CongeFichierPage />} />
          <Route
            path="fichiers/niveaux-etudes"
            element={
              <RefFichierPage
                title="Niveau d’études"
                description="Niveaux d’études de référence (fichier père)."
                collection="niveauxEtudes"
                addLabel="Nouveau niveau"
              />
            }
          />
          <Route
            path="fichiers/sites-affectation"
            element={
              <RefFichierPage
                title="Site de travail"
                description="Sites de travail du personnel (fichier père)."
                collection="sitesAffectation"
                addLabel="Nouveau site"
              />
            }
          />
          <Route
            path="fichiers/directions"
            element={
              <RefFichierPage
                title="Direction"
                description="Directions organisationnelles (fichier père)."
                collection="directions"
                addLabel="Nouvelle direction"
              />
            }
          />
          <Route
            path="fichiers/statuts-personnel"
            element={
              <RefFichierPage
                title="Statut"
                description="Statuts du personnel (fichier père)."
                collection="statutsPersonnel"
                addLabel="Nouveau statut"
              />
            }
          />
          <Route
            path="fichiers/comptes-comptables"
            element={
              <RefFichierPage
                title="Compte comptable"
                description="Comptes comptables liés au personnel (fichier père)."
                collection="comptesComptables"
                addLabel="Nouveau compte"
              />
            }
          />
          <Route
            path="fichiers/types-contrats"
            element={
              <RefFichierPage
                title="Type de contrat"
                description="Types de contrat du personnel (fichier TYPE_CONTRAT)."
                collection="typesContrats"
                addLabel="Nouveau type de contrat"
              />
            }
          />
          <Route path="fichiers/periodes" element={<PeriodeFichierPage />} />
          <Route path="fichiers/monnaies" element={<MonnaieFichierPage />} />
          <Route
            path="fichiers/taux-monnaie"
            element={<TauxMonnaieFichierPage />}
          />
          <Route
            path="edition"
            element={
              <PlaceholderToolPage
                title="Edition"
                text="Outils d’édition des fichiers de paramètres (à développer)."
              />
            }
          />
          <Route
            path="importation"
            element={
              <Navigate to="/parametres/importation/fichier-personnel" replace />
            }
          />
          <Route
            path="importation/fichier-personnel"
            element={<ImportPersonnelPage />}
          />
          <Route
            path="importation/fonction-ag"
            element={<ImportFichierStructurePage structureId="fonction-ag" />}
          />
          <Route path="importation/bareme1" element={<ImportBareme1Page />} />
          <Route path="importation/bareme2" element={<ImportBareme2Page />} />
          <Route
            path="importation/conge"
            element={<ImportFichierStructurePage structureId="conge" />}
          />
          <Route
            path="importation/compte-comptable"
            element={
              <ImportFichierStructurePage structureId="compte-comptable" />
            }
          />
          <Route
            path="suppression"
            element={
              <PlaceholderToolPage
                title="Suppression Fichier"
                text="Suppression sécurisée de fichiers de paramètres (à développer)."
              />
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
