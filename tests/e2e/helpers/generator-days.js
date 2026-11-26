import {expect} from '@playwright/test';
export async function setGeneratorDays(page,count){
 const current=Number.parseInt(await page.locator('#generatorDays').textContent(),10);
 for(let i=0;i<Math.abs(count-current);i++)await page.getByRole('button',{name:count>current?'Więcej dni':'Mniej dni',exact:true}).click();
 await expect(page.locator('#generatorDays')).toHaveText(count+(count===1?' dzień':' dni'));
}
