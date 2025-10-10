import { getClientById } from '@/api/make-cases/make-case'
import { ClientProfileToggle } from '@/app/_components/clientProfile/EditClientProfile'

const page = async ({
    params,
}: {
    params: Promise<{
        clientId: string
    }>
}) => {
    const { clientId } = await params
    const client = await getClientById(clientId)

    return <ClientProfileToggle client={client} id={clientId} />
}

export default page
