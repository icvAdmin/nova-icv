'use client'

import ProfileSection from '@/app/_components/intakeForm/ProfileComponent'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useIntakeFormStore } from '../../_lib/useIntakeFormStore'

const IntakeContent = () => {
    const searchParams = useSearchParams()
    const spouseID = searchParams?.get('spouseID') || undefined

    const { form: loadedForm, updateForm } = useIntakeFormStore()

    const router = useRouter()

    return (
        <div className="mt-[24px] flex min-h-screen items-center justify-center">
            <div className="w-full space-y-[60px] px-[100px]">
                <div>
                    <label className="block text-center font-['Epilogue'] text-[40px] font-bold leading-[56px] text-neutral-900">
                        Client Profile
                    </label>
                </div>

                <ProfileSection
                    formType={loadedForm}
                    updateForm={updateForm}
                    spouseID={spouseID}
                    onSubmitNew={(data) => {
                        updateForm(data)
                        router.push('/intake/background')
                    }}
                    submitType="next"
                    titleStyle="font-['Epilogue'] text-[28px] font-semibold leading-[40px] text-neutral-900"
                />
            </div>
        </div>
    )
}

const Page = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <IntakeContent />
        </Suspense>
    )
}

export default Page
